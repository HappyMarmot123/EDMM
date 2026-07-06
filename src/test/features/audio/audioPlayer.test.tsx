import { act, render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { AudioPlayer, MobileAudioPlayer } from "@/features/audio";
import AudioPlayerWidget from "@/widgets/audioPlayer";
import type { Track } from "@/entities/track";

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
  playbackError: "autoplay-blocked" | "unsupported-audio-context" | "source-load-failed" | null;
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
  playbackError: null,
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
    // 풀스크린 뷰포트 쿼리에만 매치를 적용한다. 전 쿼리 true로 하면
    // prefers-reduced-motion까지 걸려 fade 경로가 생략되기 때문.
    matches: query === "(min-width: 768px)" ? matches : false,
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
      playbackError: null,
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
    const playerGrid = player.querySelector("#player");
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
    expect(volumeSlider).toHaveAttribute("aria-valuenow", "70");
    expect(within(volumeZone).queryByText("EQ Presets")).not.toBeInTheDocument();
  });

  it("renders playback errors as a fixed desktop popup outside player layout zones", () => {
    mockAudioPlayerState.playbackError = "autoplay-blocked";

    render(<AudioPlayer />);

    const feedback = screen.getByRole("status", {
      name: "Playback error feedback",
    });

    expect(feedback).toHaveClass("absolute");
    expect(feedback).toHaveTextContent(
      "브라우저가 자동 재생을 막았습니다. 재생 버튼을 한 번 더 눌러 주세요.",
    );
    expect(screen.getByTestId("player-track-zone")).not.toContainElement(feedback);
    expect(screen.getByTestId("player-control-zone")).not.toContainElement(
      feedback,
    );
    expect(screen.getByTestId("player-volume-zone")).not.toContainElement(feedback);

    fireEvent.click(screen.getByRole("button", { name: "다시 재생" }));

    expect(mockAudioPlayerState.togglePlayPause).toHaveBeenCalledTimes(1);
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

    // 상세 드래그 동작은 volumeBar 단위 테스트가 담당 — 여기서는 배선 확인
    fireEvent.keyDown(volumeSlider, { key: "ArrowUp" });

    expect(mockAudioPlayerState.setLiveVolume).toHaveBeenCalledWith(0.75);
    expect(mockAudioPlayerState.setVolume).toHaveBeenCalledWith(0.75);
  });

  it("restores a minimum audible volume when unmuting from zero", () => {
    mockAudioPlayerState.isMuted = true;
    mockAudioPlayerState.volume = 0;

    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));

    expect(mockAudioPlayerState.setLiveVolume).toHaveBeenCalledWith(0.1);
    expect(mockAudioPlayerState.setVolume).toHaveBeenCalledWith(0.1);
    // setVolume(0.1)이 provider에서 자동 unmute하므로 toggleMute는 호출하지 않는다
    expect(mockAudioPlayerState.toggleMute).not.toHaveBeenCalled();
  });

  it("keeps plain toggle behavior when unmuting with an audible volume", () => {
    mockAudioPlayerState.isMuted = true;
    mockAudioPlayerState.volume = 0.7;

    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));

    expect(mockAudioPlayerState.toggleMute).toHaveBeenCalledTimes(1);
    expect(mockAudioPlayerState.setVolume).not.toHaveBeenCalled();
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

  it("opens and closes the desktop fullscreen player without changing playback", async () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    expect(fullscreenDialog).toBeInTheDocument();
    expect(fullscreenDialog).toHaveClass("min-h-screen", "min-h-dvh");
    expect(fullscreenDialog).toHaveAttribute("tabindex", "-1");
    expect(screen.getByAltText("Track One fullscreen artwork")).toBeInTheDocument();
    expect(screen.getByTestId("fullscreen-audio-visualizer-canvas")).toHaveAttribute(
      "data-visualizer-renderer",
      "fullscreen-segmented-bars",
    );
    expect(screen.getByLabelText("Audio Player")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Track One" })).not.toBeInTheDocument();
    expect(mockAudioPlayerState.togglePlayPause).not.toHaveBeenCalled();
    expect(
      within(fullscreenDialog).queryByRole("button", {
        name: "Exit fullscreen view",
      }),
    ).not.toBeInTheDocument();

    jest.useFakeTimers();
    fireEvent.keyDown(window, { key: "Escape" });

    // fade-out 동안에는 마운트가 유지되고 입력은 차단된다
    expect(screen.getByTestId("fullscreen-fade-layer")).toHaveClass(
      "pointer-events-none",
      "opacity-0",
    );

    act(() => {
      jest.advanceTimersByTime(260);
    });
    expect(
      screen.queryByRole("dialog", { name: "Fullscreen player" }),
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("fades the fullscreen player in on open", () => {
    jest.useFakeTimers();
    try {
      render(<AudioPlayer />);

      fireEvent.click(
        screen.getByRole("button", { name: "Toggle fullscreen view" }),
      );

      const fadeLayer = screen.getByTestId("fullscreen-fade-layer");
      expect(fadeLayer).toHaveClass("opacity-0");

      act(() => {
        jest.advanceTimersByTime(25);
      });
      expect(fadeLayer).toHaveClass("opacity-100");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps Tab from moving focus while desktop fullscreen is open", async () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    await waitFor(() => expect(fullscreenDialog).toHaveFocus());

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      code: "Tab",
      bubbles: true,
      cancelable: true,
    });

    expect(window.dispatchEvent(tabEvent)).toBe(false);
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(fullscreenDialog).toHaveFocus();
  });

  // 단축키 힌트는 Radix 툴팁(controlled)으로 렌더된다 — focus/hover로 열리고 blur로 닫힌다
  it("shows fullscreen keyboard guidance while the shortcut button is focused", async () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    const shortcutButton = within(fullscreenDialog).getByRole("button", {
      name: "Show fullscreen shortcuts",
    });

    expect(screen.queryAllByText("Keyboard controls")).toHaveLength(0);

    act(() => shortcutButton.focus());

    // Radix 툴팁은 콘텐츠를 가시 본문 + 접근성용 숨김 사본으로 두 번 렌더한다
    expect((await screen.findAllByText("Keyboard controls")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Space").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Previous track").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Next track").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Close shortcuts / exit fullscreen").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tab is locked/i).length).toBeGreaterThan(0);

    act(() => shortcutButton.blur());

    await waitFor(() =>
      expect(screen.queryAllByText("Keyboard controls")).toHaveLength(0),
    );
  });

  it("keeps playback shortcuts active after opening fullscreen keyboard guidance", async () => {
    render(<AudioPlayerWidget />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Toggle fullscreen view" }),
    );

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    const shortcutButton = within(fullscreenDialog).getByRole("button", {
      name: "Show fullscreen shortcuts",
    });

    shortcutButton.focus();
    fireEvent.click(shortcutButton);

    // 힌트가 열려 트리거에 포커스가 남아 있어도 재생 단축키는 동작해야 한다
    // (버튼은 더 이상 단축키를 차단하지 않음)
    fireEvent.keyDown(document.activeElement ?? fullscreenDialog, {
      code: "KeyN",
    });

    expect(mockAudioPlayerState.nextTrack).toHaveBeenCalledTimes(1);
  });

  it("closes fullscreen keyboard guidance when focus leaves the shortcut button", async () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    const shortcutButton = within(fullscreenDialog).getByRole("button", {
      name: "Show fullscreen shortcuts",
    });

    act(() => shortcutButton.focus());
    expect((await screen.findAllByText("Keyboard controls")).length).toBeGreaterThan(0);

    act(() => shortcutButton.blur());

    await waitFor(() =>
      expect(screen.queryAllByText("Keyboard controls")).toHaveLength(0),
    );
    expect(fullscreenDialog).toBeInTheDocument();
  });

  it("closes fullscreen keyboard guidance before closing fullscreen with Escape", async () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

    const fullscreenDialog = await screen.findByRole("dialog", {
      name: "Fullscreen player",
    });
    const shortcutButton = within(fullscreenDialog).getByRole("button", {
      name: "Show fullscreen shortcuts",
    });
    act(() => shortcutButton.focus());

    expect((await screen.findAllByText("Keyboard controls")).length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryAllByText("Keyboard controls")).toHaveLength(0),
    );
    expect(fullscreenDialog).toBeInTheDocument();

    jest.useFakeTimers();
    fireEvent.keyDown(window, { key: "Escape" });

    act(() => {
      jest.advanceTimersByTime(260);
    });
    expect(
      screen.queryByRole("dialog", { name: "Fullscreen player" }),
    ).not.toBeInTheDocument();
    jest.useRealTimers();
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

  it("renders playback errors as a fixed mobile popup outside the compact player", () => {
    mockAudioPlayerState.playbackError = "source-load-failed";

    render(<MobileAudioPlayer />);

    const feedback = screen.getByRole("status", {
      name: "Playback error feedback",
    });
    const mobilePlayer = document.getElementById("player-mobile");

    expect(feedback).toHaveClass("absolute");
    expect(feedback).toHaveTextContent(
      "지금은 이 트랙을 재생할 수 없습니다. 다른 트랙을 선택해 주세요.",
    );
    expect(mobilePlayer).not.toContainElement(feedback);
    expect(
      screen.queryByRole("button", { name: "다시 재생" }),
    ).not.toBeInTheDocument();
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
      const dialog = await screen.findByRole("dialog", {
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
