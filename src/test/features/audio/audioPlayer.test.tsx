import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import AudioPlayer from "@/features/audio/ui/audioPlayer";
import MobileAudioPlayer from "@/features/audio/ui/mobileAudioPlayer";
import type { Track } from "@/entities/track/model";

const track: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl: "https://example.com/art.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/audio.mp3",
  metadata: {},
};

type MockAudioPlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  seek: jest.Mock;
  togglePlayPause: jest.Mock;
  nextTrack: jest.Mock;
  prevTrack: jest.Mock;
  setVolume: jest.Mock;
  setLiveVolume: jest.Mock;
  toggleMute: jest.Mock;
  audioAnalyser: AnalyserNode | null;
};

let mockAudioPlayerState: MockAudioPlayerState = {
  currentTrack: track,
  isPlaying: false,
  isBuffering: false,
  currentTime: 12,
  duration: 180,
  volume: 0.7,
  isMuted: false,
  seek: jest.fn(),
  togglePlayPause: jest.fn(),
  nextTrack: jest.fn(),
  prevTrack: jest.fn(),
  setVolume: jest.fn(),
  setLiveVolume: jest.fn(),
  toggleMute: jest.fn(),
  audioAnalyser: null,
};

const mockRouterReplace = jest.fn();

const mockFullscreenViewport = (matches: boolean) => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

describe("AudioPlayer", () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
    mockFullscreenViewport(true);
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D);
    mockAudioPlayerState = {
      currentTrack: track,
      isPlaying: false,
      isBuffering: false,
      currentTime: 12,
      duration: 180,
      volume: 0.7,
      isMuted: false,
      seek: jest.fn(),
      togglePlayPause: jest.fn(),
      nextTrack: jest.fn(),
      prevTrack: jest.fn(),
      setVolume: jest.fn(),
      setLiveVolume: jest.fn(),
      toggleMute: jest.fn(),
      audioAnalyser: null,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("pins the desktop player to the bottom and renders player controls", () => {
    render(<AudioPlayer />);

    const player = screen.getByLabelText("Audio Player");

    expect(player).toHaveAttribute("id", "player-container");
    expect(player).toHaveClass("fixed", "bottom-0", "inset-x-0");
    expect(document.getElementById("player-controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("renders player content in the fixed (non-responsive) layout", () => {
    render(<AudioPlayer />);

    const player = screen.getByLabelText("Audio Player");
    const playerGrid = player.firstElementChild;
    const trackZone = screen.getByTestId("player-track-zone");
    const controlZone = screen.getByTestId("player-control-zone");
    const volumeZone = screen.getByTestId("player-volume-zone");
    const seekSlider = within(controlZone).getByRole("slider");
    const volumeSlider = within(volumeZone).getByRole("slider", {
      name: "Volume",
    });

    expect(playerGrid).toHaveClass(
      "grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(164px,0.75fr)]"
    );
    expect(trackZone).toContainElement(
      screen.getByRole("button", { name: "Open details for Track One" })
    );
    expect(trackZone).toHaveTextContent("Track One");
    expect(trackZone).toHaveTextContent("Artist One");
    expect(controlZone).toContainElement(
      screen.getByRole("button", { name: "Play" })
    );
    expect(seekSlider).toHaveAttribute("aria-valuenow", "12");
    expect(seekSlider).toHaveAttribute("aria-valuemax", "180");
    expect(volumeZone).toHaveClass("flex");
    expect(volumeSlider).toHaveValue("0.7");
  });

  it("fires previous and next actions from desktop controls", () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
    fireEvent.click(screen.getByRole("button", { name: "Next track" }));

    expect(mockAudioPlayerState.prevTrack).toHaveBeenCalledTimes(1);
    expect(mockAudioPlayerState.nextTrack).toHaveBeenCalledTimes(1);
  });

  it("applies volume slider interaction to live and persisted volume", () => {
    render(<AudioPlayer />);

    const volumeSlider = screen.getByRole("slider", {
      name: "Volume",
    });

    fireEvent.change(volumeSlider, { target: { value: "0.2" } });
    fireEvent.mouseUp(volumeSlider);

    expect(mockAudioPlayerState.setLiveVolume).toHaveBeenCalledWith(0.2);
    expect(mockAudioPlayerState.setVolume).toHaveBeenCalledWith(0.2);
  });

  it("does not rotate persistent desktop artwork while playback is active", () => {
    mockAudioPlayerState.isPlaying = true;

    render(<AudioPlayer />);

    expect(screen.getByAltText("Album One")).not.toHaveClass(
      "animate-rotate-album"
    );
  });

  it("keeps the desktop player visible before a track is selected", () => {
    mockAudioPlayerState.currentTrack = null;
    mockAudioPlayerState.currentTime = 0;
    mockAudioPlayerState.duration = 0;

    render(<AudioPlayer />);

    expect(screen.getByLabelText("Audio Player")).toHaveAttribute(
      "id",
      "player-container"
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeDisabled();
    fireEvent.click(playButton);
    expect(mockAudioPlayerState.togglePlayPause).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "No track artwork" })).toBeDisabled();
  });

  it("opens and closes the desktop fullscreen player without changing playback", () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = screen.getByRole("dialog", {
      name: "Fullscreen player",
    });
    expect(fullscreenDialog).toBeInTheDocument();
    expect(fullscreenDialog).toHaveClass("min-h-screen", "min-h-dvh");
    expect(screen.getByAltText("Track One fullscreen artwork")).toBeInTheDocument();
    expect(screen.getByTestId("fullscreen-audio-visualizer-canvas")).toHaveAttribute(
      "data-visualizer-renderer",
      "fullscreen-segmented-bars",
    );
    expect(screen.getByLabelText("Audio Player")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Track One" })).not.toBeInTheDocument();
    expect(mockAudioPlayerState.togglePlayPause).not.toHaveBeenCalled();

    fireEvent.click(
      within(fullscreenDialog).getByRole("button", {
        name: "Exit fullscreen view",
      }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Fullscreen player" }),
    ).not.toBeInTheDocument();
  });

  it("does not expose fullscreen controls below the 768px viewport", () => {
    mockFullscreenViewport(false);

    render(<AudioPlayer />);

    expect(
      screen.queryByRole("button", { name: "Toggle fullscreen view" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Fullscreen player" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the mobile player visible before a track is selected", () => {
    mockAudioPlayerState.currentTrack = null;
    mockAudioPlayerState.currentTime = 0;
    mockAudioPlayerState.duration = 0;

    render(<MobileAudioPlayer />);

    expect(screen.getByLabelText("Audio Player")).toHaveAttribute(
      "id",
      "player-container-mobile"
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("keeps mobile fullscreen drag stable when pointer capture APIs are unavailable", async () => {
    const originalSetPointerCapture = Element.prototype.setPointerCapture;
    const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
    Object.defineProperty(Element.prototype, "setPointerCapture", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "releasePointerCapture", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      render(<MobileAudioPlayer />);

      fireEvent.click(screen.getByRole("button", { name: "Open fullscreen player" }));
      const dialog = screen.getByRole("dialog", {
        name: "Mobile fullscreen player",
      });
      const closeButton = within(dialog).getByRole("button", {
        name: "Close fullscreen player",
      });

      expect(() => {
        fireEvent.pointerDown(closeButton, { pointerId: 1, clientY: 12 });
      }).not.toThrow();
      fireEvent.pointerMove(closeButton, { pointerId: 1, clientY: 92 });
      fireEvent.pointerCancel(closeButton, { pointerId: 1, clientY: 92 });

      await waitFor(() => {
        expect(dialog).toHaveStyle({ transform: "translateY(0px)" });
      });
    } finally {
      Object.defineProperty(Element.prototype, "setPointerCapture", {
        configurable: true,
        writable: true,
        value: originalSetPointerCapture,
      });
      Object.defineProperty(Element.prototype, "releasePointerCapture", {
        configurable: true,
        writable: true,
        value: originalReleasePointerCapture,
      });
    }
  });
});
