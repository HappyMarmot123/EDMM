import { fireEvent, render, screen } from "@testing-library/react";
import SeekBar from "@/features/audio/components/seekBar";
import { installPointerEventPolyfill } from "@/test/testUtils/pointerEventPolyfill";

beforeAll(() => {
  installPointerEventPolyfill();
});

const renderSeekBar = (
  overrides: Partial<{ currentTime: number; duration: number; seek: jest.Mock }> = {},
) => {
  const seek = overrides.seek ?? jest.fn();
  render(
    <SeekBar
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
    bottom: 16,
    width: 200,
    height: 16,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  return { slider, seek };
};

describe("SeekBar", () => {
  it("commits a single seek on pointer release at the drag position", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(90); // 150/200 * 120s
  });

  it("shows drag preview in aria-valuenow without seeking mid-drag", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 100 });

    expect(slider).toHaveAttribute("aria-valuenow", "60"); // 100/200 * 120s
    expect(seek).not.toHaveBeenCalled();
  });

  it("cancels the drag with Escape and reverts to playback position", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 150 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "30");
  });

  it("clamps drag beyond the bar to track bounds", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 400 });

    expect(seek).toHaveBeenCalledWith(120);
  });

  it("keeps arrow-key seeking (±5s)", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(seek).toHaveBeenNthCalledWith(1, 25);
    expect(seek).toHaveBeenNthCalledWith(2, 35);
  });

  it("does nothing without a duration", () => {
    const { slider, seek } = renderSeekBar({ duration: 0 });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });

    expect(seek).not.toHaveBeenCalled();
  });

  it("survives missing pointer capture APIs (jsdom)", () => {
    const { slider } = renderSeekBar();

    expect(() => {
      fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
      fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });
    }).not.toThrow();
  });
});
