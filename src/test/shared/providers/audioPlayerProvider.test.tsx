import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "@/shared/providers/audioPlayerProvider";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import type { Track } from "@/entities/track/model";

const mockDetachAudioListeners = jest.fn();
const mockCleanAudioInstance = jest.fn();
const mockAudio = document.createElement("audio");

const mockAudioContext = {
  state: "running",
  resume: jest.fn(),
} as unknown as AudioContext;

const defaultAudioStoreState = {
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

let mockAudioStoreState = defaultAudioStoreState;

jest.mock("@/app/store/audioInstanceStore", () => ({
  __esModule: true,
  default: (selector: (state: unknown) => unknown) =>
    selector(mockAudioStoreState),
}));

jest.mock("@/shared/lib/audioEventManager", () => ({
  setupAudioEventListeners: jest.fn(() => mockDetachAudioListeners),
}));

jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  cacheTrack: jest.fn(async () => undefined),
  getCachedTrack: jest.fn(async () => undefined),
}));

jest.mock("@/shared/db/repositories/recentPlaysRepo", () => ({
  addRecentPlay: jest.fn(async () => undefined),
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

describe("AudioPlayerProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    Object.defineProperty(mockAudio, "play", {
      configurable: true,
      value: jest.fn(async () => {
        throw new DOMException("blocked", "NotAllowedError");
      }),
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
  });
});
