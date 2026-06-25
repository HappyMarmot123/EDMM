import { render, screen } from "@testing-library/react";
import AudioVisualizer from "@/features/audio/components/audioVisualizer";

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
});
