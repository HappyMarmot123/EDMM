import { fireEvent, render, screen } from "@testing-library/react";
import MSeekBar from "@/features/audio/components/mobile/mSeekBar";
import { installPointerEventPolyfill } from "@/test/testUtils/pointerEventPolyfill";

beforeAll(() => {
  installPointerEventPolyfill();
});

const renderMSeekBar = (
  overrides: Partial<{ currentTime: number; duration: number; seek: jest.Mock }> = {},
) => {
  const seek = overrides.seek ?? jest.fn();
  render(
    <MSeekBar
      currentTime={overrides.currentTime ?? 30}
      duration={overrides.duration ?? 120}
      seek={seek}
    />,
  );
  const slider = screen.getByRole("slider", { name: "Seek slider" });
  jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 32,
    width: 200,
    height: 32,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  return { slider, seek };
};

describe("MSeekBar", () => {
  it("commits a single seek on pointer release at the drag position", () => {
    const { slider, seek } = renderMSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(90); // 150/200 * 120s
  });

  it("previews the drag position in the current-time label without seeking", () => {
    const { slider, seek } = renderMSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 100 });

    // 30s → 드래그 프리뷰 60s (01:00)
    expect(screen.getByTestId("mseek-current-time")).toHaveTextContent("01:00");
    expect(slider).toHaveAttribute("aria-valuenow", "60");
    expect(seek).not.toHaveBeenCalled();
  });

  it("cancels the drag with Escape and reverts the label", () => {
    const { slider, seek } = renderMSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 150 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).not.toHaveBeenCalled();
    expect(screen.getByTestId("mseek-current-time")).toHaveTextContent("00:30");
  });

  it("clamps drag beyond the bar to track bounds", () => {
    const { slider, seek } = renderMSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 400 });

    expect(seek).toHaveBeenCalledWith(120);
  });

  it("does nothing without a duration", () => {
    const { slider, seek } = renderMSeekBar({ duration: 0 });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });

    expect(seek).not.toHaveBeenCalled();
  });

  it("marks the bar as dragging for the size-up style", () => {
    const { slider } = renderMSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    expect(slider).toHaveAttribute("data-dragging", "true");

    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });
    expect(slider).not.toHaveAttribute("data-dragging");
  });
});
