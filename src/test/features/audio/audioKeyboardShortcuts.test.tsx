import { fireEvent, render, screen } from "@testing-library/react";
import { useAudioKeyboardShortcuts } from "@/features/audio";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));

const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

const createAudioState = () => ({
  audioAnalyser: null,
  audioCapabilities: {
    audioElementAvailable: false,
    audioContextAvailable: false,
    analyserAvailable: false,
    initializationError: null,
  },
  audioContext: null,
  audioInstance: null,
  cleanAudioInstance: jest.fn(),
  currentTime: 50,
  currentTrack: {
    id: "track-1",
    source: "cloudinary" as const,
    title: "Track One",
    artistId: "artist-1",
    artistName: "Artist",
    albumName: "Album",
    artworkUrl: "",
    durationMs: 180000,
    streamUrl: "https://example.com/track.mp3",
    metadata: {},
  },
  duration: 180,
  handleSelectTrack: jest.fn(),
  isBuffering: false,
  isMuted: false,
  isPlaying: false,
  isShuffleEnabled: false,
  playbackError: null,
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

  return (
    <div>
      <input aria-label="Search catalog" />
      <div contentEditable role="textbox" aria-label="Editable title" />
      <div role="slider" aria-label="Custom progress" tabIndex={0} />
      <input type="range" aria-label="Native progress" />
      <button type="button" aria-label="Focused control">
        Control
      </button>
    </div>
  );
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

  it("skips to the next track with N", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    fireEvent.keyDown(window, { code: "KeyN" });

    expect(audioState.nextTrack).toHaveBeenCalledTimes(1);
  });

  it("skips to the previous track with P", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    fireEvent.keyDown(window, { code: "KeyP" });

    expect(audioState.prevTrack).toHaveBeenCalledTimes(1);
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

  it("allows playback shortcuts while a control button is focused", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    const button = screen.getByRole("button", { name: "Focused control" });
    button.focus();

    fireEvent.keyDown(button, { code: "Space" });
    fireEvent.keyDown(button, { code: "KeyN" });

    expect(audioState.togglePlayPause).toHaveBeenCalledTimes(1);
    expect(audioState.nextTrack).toHaveBeenCalledTimes(1);
  });

  it("allows non-arrow shortcuts from sliders while blocking arrows", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);
    const slider = screen.getByRole("slider", { name: "Custom progress" });

    fireEvent.keyDown(slider, { code: "Space" });
    fireEvent.keyDown(slider, { code: "ArrowRight" });
    fireEvent.keyDown(slider, { code: "ArrowUp" });

    expect(audioState.togglePlayPause).toHaveBeenCalledTimes(1);
    expect(audioState.seek).not.toHaveBeenCalled();
    expect(audioState.setVolume).not.toHaveBeenCalled();
  });

  it("ignores shortcuts from editable and slider controls", () => {
    const audioState = createAudioState();
    mockUseAudioPlayer.mockReturnValue(audioState);

    render(<KeyboardShortcutHarness />);

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Editable title" }), {
      code: "Space",
    });
    fireEvent.keyDown(screen.getByRole("slider", { name: "Custom progress" }), {
      code: "ArrowRight",
    });
    fireEvent.keyDown(screen.getByRole("slider", { name: "Native progress" }), {
      code: "ArrowLeft",
    });

    expect(audioState.togglePlayPause).not.toHaveBeenCalled();
    expect(audioState.seek).not.toHaveBeenCalled();
  });
});
