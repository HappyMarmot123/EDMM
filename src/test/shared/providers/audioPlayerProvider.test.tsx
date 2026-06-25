import { render, screen } from "@testing-library/react";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "@/shared/providers/audioPlayerProvider";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";

const mockDetachAudioListeners = jest.fn();
const mockCleanAudioInstance = jest.fn();
const mockAudio = document.createElement("audio");

const mockAudioContext = {
  state: "running",
  resume: jest.fn(),
} as unknown as AudioContext;

jest.mock("@/app/store/audioInstanceStore", () => ({
  __esModule: true,
  default: (selector: (state: unknown) => unknown) =>
    selector({
      audioInstance: mockAudio,
      audioContext: mockAudioContext,
      audioAnalyser: null,
      cleanAudioInstance: mockCleanAudioInstance,
    }),
}));

jest.mock("@/shared/lib/audioEventManager", () => ({
  setupAudioEventListeners: jest.fn(() => mockDetachAudioListeners),
}));

jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  cacheTrack: jest.fn(async () => undefined),
}));

jest.mock("@/shared/db/repositories/recentPlaysRepo", () => ({
  addRecentPlay: jest.fn(async () => undefined),
}));

function AudioConsumer() {
  const { audioInstance } = useAudioPlayer();

  return <div data-testid="audio-ready">{audioInstance ? "ready" : "empty"}</div>;
}

describe("AudioPlayerProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
