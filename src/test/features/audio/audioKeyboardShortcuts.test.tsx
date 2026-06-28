import { fireEvent, render, screen } from "@testing-library/react";
import { useAudioKeyboardShortcuts } from "@/features/audio/hooks/useAudioKeyboardShortcuts";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));

const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

const createAudioState = () => ({
  audioAnalyser: null,
  audioContext: null,
  audioInstance: null,
  cleanAudioInstance: jest.fn(),
  currentTime: 50,
  currentTrack: {
    album: "Album",
    artworkId: "",
    assetId: "track-1",
    name: "Track One",
    producer: "Artist",
    url: "https://example.com/track.mp3",
  },
  duration: 180,
  handleSelectTrack: jest.fn(),
  isBuffering: false,
  isMuted: false,
  isPlaying: false,
  isShuffleEnabled: false,
  nextTrack: jest.fn(),
  playTrack: jest.fn(),
  prevTrack: jest.fn(),
  seek: jest.fn(),
  seekTo: jest.fn(),
  setCurrentTime: jest.fn(),
  setDuration: jest.fn(),
  setIsBuffering: jest.fn(),
  setIsPlaying: jest.fn(),
  setLiveVolume: jest.fn(),
  setTrack: jest.fn(),
  setVolume: jest.fn(),
  toggleMute: jest.fn(),
  togglePlayPause: jest.fn(),
  toggleShuffle: jest.fn(),
  volume: 0.5,
});

function KeyboardShortcutHarness() {
  useAudioKeyboardShortcuts();

  return <input aria-label="Search catalog" />;
}

describe("useAudioKeyboardShortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggles playback with Space", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    fireEvent.keyDown(window, { code: "Space" });

    expect(audioState.togglePlayPause).toHaveBeenCalledTimes(1);
  });

  it("seeks ten seconds backward and forward with horizontal arrows", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    fireEvent.keyDown(window, { code: "ArrowLeft" });
    fireEvent.keyDown(window, { code: "ArrowRight" });

    expect(audioState.seek).toHaveBeenNthCalledWith(1, 40);
    expect(audioState.seek).toHaveBeenNthCalledWith(2, 60);
  });

  it("changes volume with vertical arrows", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    fireEvent.keyDown(window, { code: "ArrowUp" });
    fireEvent.keyDown(window, { code: "ArrowDown" });

    expect(audioState.setVolume).toHaveBeenNthCalledWith(1, 0.55);
    expect(audioState.setLiveVolume).toHaveBeenNthCalledWith(1, 0.55);
    expect(audioState.setVolume).toHaveBeenNthCalledWith(2, 0.45);
    expect(audioState.setLiveVolume).toHaveBeenNthCalledWith(2, 0.45);
  });

  it("ignores shortcuts while typing in inputs", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    screen.getByRole("textbox", { name: "Search catalog" }).focus();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Search catalog" }), {
      code: "Space",
    });

    expect(audioState.togglePlayPause).not.toHaveBeenCalled();
  });
});
