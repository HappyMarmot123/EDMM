import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "@/shared/providers/audioPlayerProvider";
import { addRecentPlay } from "@/shared/db";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import type { Track } from "@/entities/track";

const mockDetachAudioListeners = jest.fn();
const mockCleanAudioInstance = jest.fn();
const mockAudio = document.createElement("audio");

const mockAudioContext = {
  state: "running",
  resume: jest.fn(),
} as unknown as AudioContext;

type MockAudioStoreState = {
  audioInstance: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  audioAnalyser: AnalyserNode | null;
  audioCapabilities: {
    audioElementAvailable: boolean;
    audioContextAvailable: boolean;
    analyserAvailable: boolean;
    initializationError: string | null;
  };
  cleanAudioInstance: jest.Mock;
};

const defaultAudioStoreState: MockAudioStoreState = {
  audioInstance: mockAudio,
  audioContext: mockAudioContext,
  audioAnalyser: null,
  audioCapabilities: {
    audioElementAvailable: true,
    audioContextAvailable: true,
    analyserAvailable: false,
    initializationError: null,
  },
  cleanAudioInstance: mockCleanAudioInstance,
};

let mockAudioStoreState: MockAudioStoreState = defaultAudioStoreState;

jest.mock("@/app/store/audioInstanceStore", () => ({
  __esModule: true,
  default: (selector: (state: unknown) => unknown) =>
    selector(mockAudioStoreState),
}));

jest.mock("@/shared/lib/audioEventManager", () => ({
  setupAudioEventListeners: jest.fn(() => mockDetachAudioListeners),
}));

// 재생 소스 전환은 오디오 엔진 API(transitionAudioTrack)를 경유한다 (AE8).
const mockTransitionAudioTrack = jest.fn<Promise<void>, unknown[]>(
  async () => undefined,
);
jest.mock("@/shared/lib/audioInstance", () => ({
  setMasterAudioVolume: jest.fn(),
  transitionAudioTrack: (...args: unknown[]) => mockTransitionAudioTrack(...args),
}));

jest.mock("@/shared/db", () => ({
  addRecentPlay: jest.fn(async () => undefined),
  cacheTrack: jest.fn(async () => undefined),
  getCachedTrack: jest.fn(async () => undefined),
}));

const mockCapturePlaybackErrorEvent = jest.fn();
jest.mock("@/shared/lib/sentry/playbackEvents", () => ({
  capturePlaybackErrorEvent: (...args: unknown[]) =>
    mockCapturePlaybackErrorEvent(...args),
  getCurrentBrowserRoute: () => "/",
}));

function AudioConsumer() {
  const { audioInstance } = useAudioPlayer();

  return <div data-testid="audio-ready">{audioInstance ? "ready" : "empty"}</div>;
}

const playableTrack: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl: "",
  durationMs: 180000,
  streamUrl: "https://example.com/track.mp3",
  metadata: {},
};
const secondPlayableTrack: Track = {
  ...playableTrack,
  id: "track-2",
  title: "Track Two",
  artistId: "artist-2",
  artistName: "Artist Two",
  streamUrl: "https://example.com/track-2.mp3",
};
const thirdPlayableTrack: Track = {
  ...playableTrack,
  id: "track-3",
  title: "Track Three",
  artistId: "artist-3",
  artistName: "Artist Three",
  streamUrl: "https://example.com/track-3.mp3",
};
const playbackQueue = [playableTrack, secondPlayableTrack, thirdPlayableTrack];
const mockAddRecentPlay = addRecentPlay as jest.MockedFunction<
  typeof addRecentPlay
>;

function CapabilityConsumer() {
  const player = useAudioPlayer() as ReturnType<typeof useAudioPlayer> & {
    audioCapabilities?: {
      audioElementAvailable: boolean;
      audioContextAvailable: boolean;
      analyserAvailable: boolean;
      initializationError: string | null;
    };
  };

  return (
    <div>
      <span data-testid="audio-capability">
        {player.audioCapabilities?.audioContextAvailable ? "context" : "no-context"}
      </span>
      <span data-testid="analyser-capability">
        {player.audioCapabilities?.analyserAvailable ? "analyser" : "no-analyser"}
      </span>
      <span data-testid="initialization-error">
        {player.audioCapabilities?.initializationError ?? "none"}
      </span>
    </div>
  );
}

function PlaybackErrorConsumer() {
  const player = useAudioPlayer() as ReturnType<typeof useAudioPlayer> & {
    playbackError?: string | null;
  };

  return (
    <div>
      <span data-testid="playback-error">{player.playbackError ?? "none"}</span>
      <span data-testid="is-playing">{String(player.isPlaying)}</span>
      <button type="button" onClick={() => void player.playTrack(playableTrack)}>
        Play track
      </button>
    </div>
  );
}

function CurrentTrackConsumer() {
  const player = useAudioPlayer();

  return (
    <div>
      <span data-testid="current-track-id">{player.currentTrack?.id ?? "none"}</span>
      <span data-testid="current-track-title">
        {player.currentTrack?.title ?? "none"}
      </span>
      <button
        type="button"
        onClick={() => {
          void player.playTrack(playableTrack, [playableTrack], false);
        }}
      >
        Queue track
      </button>
    </div>
  );
}

function QueueNavigationConsumer() {
  const player = useAudioPlayer();

  return (
    <div>
      <span data-testid="queue-current-track-id">
        {player.currentTrack?.id ?? "none"}
      </span>
      <span data-testid="queue-is-playing">{String(player.isPlaying)}</span>
      <button
        type="button"
        onClick={() => {
          void player.playTrack(playableTrack, playbackQueue, true);
        }}
      >
        Play queue
      </button>
      <button type="button" onClick={player.nextTrack}>
        Next track
      </button>
      <button type="button" onClick={player.prevTrack}>
        Previous track
      </button>
    </div>
  );
}

describe("AudioPlayerProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransitionAudioTrack.mockImplementation(async () => undefined);
    mockAudioStoreState = defaultAudioStoreState;
    Object.defineProperty(mockAudio, "play", {
      configurable: true,
      value: jest.fn(async () => undefined),
    });
  });

  it("keeps the audio singleton alive when the route shell unmounts", () => {
    const { unmount } = render(
      <AudioPlayerProvider>
        <AudioConsumer />
      </AudioPlayerProvider>
    );

    expect(screen.getByTestId("audio-ready")).toHaveTextContent("ready");
    expect(setupAudioEventListeners).toHaveBeenCalled();

    unmount();

    expect(mockDetachAudioListeners).toHaveBeenCalled();
    expect(mockCleanAudioInstance).not.toHaveBeenCalled();
  });

  it("exposes audio capabilities when Web Audio features are unavailable", () => {
    mockAudioStoreState = {
      ...defaultAudioStoreState,
      audioContext: null,
      audioAnalyser: null,
      audioCapabilities: {
        audioElementAvailable: true,
        audioContextAvailable: false,
        analyserAvailable: false,
        initializationError: "AudioContext not supported",
      },
    };

    render(
      <AudioPlayerProvider>
        <CapabilityConsumer />
      </AudioPlayerProvider>,
    );

    expect(screen.getByTestId("audio-capability")).toHaveTextContent("no-context");
    expect(screen.getByTestId("analyser-capability")).toHaveTextContent("no-analyser");
    expect(screen.getByTestId("initialization-error")).toHaveTextContent(
      "AudioContext not supported",
    );
  });

  it("stores playbackError and restores isPlaying when audio playback rejects", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockTransitionAudioTrack.mockImplementation(async () => {
      throw new DOMException("blocked", "NotAllowedError");
    });

    render(
      <AudioPlayerProvider>
        <PlaybackErrorConsumer />
      </AudioPlayerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play track" }));

    await waitFor(() => {
      expect(screen.getByTestId("playback-error")).toHaveTextContent(
        "autoplay-blocked",
      );
      expect(screen.getByTestId("is-playing")).toHaveTextContent("false");
    });
    expect(console.warn).toHaveBeenCalledWith(
      "Error playing audio:",
      expect.any(DOMException),
    );
    expect(mockCapturePlaybackErrorEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "autoplay-blocked",
        retryable: true,
        route: "/",
        track: expect.objectContaining({
          id: "track-1",
          source: "cloudinary",
        }),
      }),
    );
  });

  it("keeps Track as the exposed current track model", async () => {
    render(
      <AudioPlayerProvider>
        <CurrentTrackConsumer />
      </AudioPlayerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Queue track" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-track-id")).toHaveTextContent("track-1");
      expect(screen.getByTestId("current-track-title")).toHaveTextContent("Track One");
    });
  });

  it("does not load a media source when a track is queued without playback", async () => {
    render(
      <AudioPlayerProvider>
        <CurrentTrackConsumer />
      </AudioPlayerProvider>,
    );
    mockTransitionAudioTrack.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Queue track" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-track-id")).toHaveTextContent("track-1");
    });
    expect(
      mockTransitionAudioTrack.mock.calls.some(
        ([source]) => source === playableTrack.streamUrl,
      ),
    ).toBe(false);
  });

  it("records recent plays for next and previous track navigation while playing", async () => {
    render(
      <AudioPlayerProvider>
        <QueueNavigationConsumer />
      </AudioPlayerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play queue" }));

    await waitFor(() => {
      expect(screen.getByTestId("queue-current-track-id")).toHaveTextContent(
        "track-1",
      );
      expect(screen.getByTestId("queue-is-playing")).toHaveTextContent("true");
      expect(mockAddRecentPlay).toHaveBeenCalledWith("track-1");
    });
    mockAddRecentPlay.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(screen.getByTestId("queue-current-track-id")).toHaveTextContent(
        "track-2",
      );
      expect(mockAddRecentPlay).toHaveBeenCalledWith("track-2");
    });
    mockAddRecentPlay.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Previous track" }));

    await waitFor(() => {
      expect(screen.getByTestId("queue-current-track-id")).toHaveTextContent(
        "track-1",
      );
      expect(mockAddRecentPlay).toHaveBeenCalledWith("track-1");
    });
  });
});
