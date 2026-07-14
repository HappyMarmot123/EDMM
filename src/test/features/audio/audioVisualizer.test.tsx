import { act, render, screen, waitFor } from "@testing-library/react";
import { AudioVisualizer } from "@/features/audio";

const fillRect = jest.fn();
const clearRect = jest.fn();
const getByteFrequencyData = jest.fn((array: Uint8Array) => {
  array.set([150, 90, 30, 0]);
});

const analyser = {
  frequencyBinCount: 4,
  getByteFrequencyData,
  smoothingTimeConstant: 0,
} as unknown as AnalyserNode;

describe("AudioVisualizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        clearRect,
        fillRect,
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D);
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the EDMM rose themed segmented-bar canvas", () => {
    render(
      <AudioVisualizer
        analyser={null}
        isActive={false}
        artistName="Artist One"
        trackTitle="Track One"
      />
    );

    const canvas = screen.getByTestId("audio-visualizer-canvas");
    expect(canvas).toHaveAttribute(
      "data-visualizer-renderer",
      "legacy-segmented-bars"
    );
    expect(canvas).toHaveAttribute("data-visualizer-theme", "edmm-rose");
    expect(screen.getByText("Rose spectrum")).toBeInTheDocument();
    expect(screen.getByText("Artist One / Track One")).toBeInTheDocument();
  });

  it("draws segmented frequency bars from analyser data while active", () => {
    const { unmount } = render(
      <AudioVisualizer analyser={analyser} isActive />
    );

    expect(window.requestAnimationFrame).toHaveBeenCalled();
    expect(getByteFrequencyData).toHaveBeenCalled();
    expect(fillRect).toHaveBeenCalled();
    expect(fillRect.mock.calls).toContainEqual([0, 218, 140, 6]);

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);
  });

  it("does not schedule animation frames while inactive", () => {
    render(<AudioVisualizer analyser={analyser} isActive={false} />);

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(getByteFrequencyData).not.toHaveBeenCalled();
  });

  it("caps canvas pixel density to avoid oversized visualizer buffers", () => {
    const originalPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    jest
      .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            width: 224,
            height: 120,
          }) as DOMRect,
      );

    try {
      render(<AudioVisualizer analyser={analyser} isActive />);
      const canvas = screen.getByTestId(
        "audio-visualizer-canvas",
      ) as HTMLCanvasElement;

      expect(canvas.width).toBe(448);
      expect(canvas.height).toBe(240);
    } finally {
      Object.defineProperty(window, "devicePixelRatio", {
        configurable: true,
        value: originalPixelRatio,
      });
    }
  });

  it("pauses live visualizer reads when the document is hidden", () => {
    const originalVisibilityState = document.visibilityState;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    try {
      render(<AudioVisualizer analyser={analyser} isActive />);

      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(getByteFrequencyData).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: originalVisibilityState,
      });
    }
  });

  it("throttles live visualizer reads to the frame budget", () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    let nextFrameId = 1;
    jest
      .mocked(window.requestAnimationFrame)
      .mockImplementation((callback) => {
        frameCallbacks.push(callback);
        return nextFrameId++;
      });

    render(<AudioVisualizer analyser={analyser} isActive />);

    expect(getByteFrequencyData).toHaveBeenCalledTimes(1);

    act(() => {
      frameCallbacks.shift()?.(10);
    });

    expect(getByteFrequencyData).toHaveBeenCalledTimes(1);

    act(() => {
      frameCallbacks.shift()?.(34);
    });

    expect(getByteFrequencyData).toHaveBeenCalledTimes(2);
  });

  it("keeps the live drawing loop briefly when playback becomes inactive", () => {
    jest.useFakeTimers();
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(7);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(jest.fn());

    const { rerender } = render(
      <AudioVisualizer analyser={analyser} isActive />
    );

    expect(window.requestAnimationFrame).toHaveBeenCalled();

    jest.mocked(window.cancelAnimationFrame).mockClear();

    rerender(<AudioVisualizer analyser={analyser} isActive={false} />);

    expect(window.cancelAnimationFrame).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(280);
    });

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);

    jest.useRealTimers();
  });

  it("syncs canvas size on window resize when ResizeObserver is unavailable", async () => {
    const originalResizeObserver = global.ResizeObserver;
    Object.defineProperty(global, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    let rectWidth = 224;
    let rectHeight = 120;
    jest
      .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            width: rectWidth,
            height: rectHeight,
          }) as DOMRect,
      );

    try {
      render(<AudioVisualizer analyser={analyser} isActive />);
      const canvas = screen.getByTestId(
        "audio-visualizer-canvas",
      ) as HTMLCanvasElement;

      expect(canvas.width).toBe(224);
      expect(canvas.height).toBe(120);

      rectWidth = 320;
      rectHeight = 180;
      window.dispatchEvent(new Event("resize"));

      await waitFor(() => {
        expect(canvas.width).toBe(320);
        expect(canvas.height).toBe(180);
      });
    } finally {
      Object.defineProperty(global, "ResizeObserver", {
        configurable: true,
        writable: true,
        value: originalResizeObserver,
      });
    }
  });
});
