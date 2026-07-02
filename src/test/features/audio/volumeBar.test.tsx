import { fireEvent, render, screen } from "@testing-library/react";
import VolumeBar from "@/features/audio/components/volumeBar";
import { installPointerEventPolyfill } from "@/test/testUtils/pointerEventPolyfill";

beforeAll(() => {
  installPointerEventPolyfill();
});

type Overrides = Partial<{
  volume: number;
  isMuted: boolean;
  setVolume: jest.Mock;
  setLiveVolume: jest.Mock;
  toggleMute: jest.Mock;
}>;

const renderVolumeBar = (overrides: Overrides = {}) => {
  const setVolume = overrides.setVolume ?? jest.fn();
  const setLiveVolume = overrides.setLiveVolume ?? jest.fn();
  const toggleMute = overrides.toggleMute ?? jest.fn();
  render(
    <VolumeBar
      volume={overrides.volume ?? 0.5}
      isMuted={overrides.isMuted ?? false}
      setVolume={setVolume}
      setLiveVolume={setLiveVolume}
      toggleMute={toggleMute}
    />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 100,
    bottom: 16,
    width: 100,
    height: 16,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  return { slider, setVolume, setLiveVolume, toggleMute };
};

describe("VolumeBar", () => {
  it("applies live volume while dragging and persists once on release", () => {
    const { slider, setVolume, setLiveVolume } = renderVolumeBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 20 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 80 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 80 });

    expect(setLiveVolume).toHaveBeenCalledWith(0.2);
    expect(setLiveVolume).toHaveBeenCalledWith(0.8);
    expect(setVolume).toHaveBeenCalledTimes(1);
    expect(setVolume).toHaveBeenCalledWith(0.8);
  });

  it("shows drag preview in aria-valuenow (percent)", () => {
    const { slider } = renderVolumeBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 30 });

    expect(slider).toHaveAttribute("aria-valuenow", "30");
  });

  it("unmutes when interaction raises volume above zero while muted", () => {
    const { slider, toggleMute } = renderVolumeBar({ isMuted: true });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });

    expect(toggleMute).toHaveBeenCalledTimes(1);
  });

  it("cancels the drag with Escape and restores the original live volume", () => {
    const { slider, setVolume, setLiveVolume } = renderVolumeBar({ volume: 0.5 });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 90 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 90 });

    expect(setLiveVolume).toHaveBeenLastCalledWith(0.5); // 원복
    expect(setVolume).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("adjusts volume by 5% with wheel and clamps at bounds", () => {
    const { slider, setVolume, setLiveVolume } = renderVolumeBar({ volume: 0.98 });

    fireEvent.wheel(slider, { deltaY: -100 }); // up → +5%, 1로 클램프
    fireEvent.wheel(slider, { deltaY: 100 }); // down → -5%

    expect(setVolume).toHaveBeenNthCalledWith(1, 1);
    expect(setLiveVolume).toHaveBeenNthCalledWith(1, 1);
    expect(setVolume).toHaveBeenNthCalledWith(2, 0.93);
  });

  it("adjusts volume by 5% with arrow keys", () => {
    const { slider, setVolume, setLiveVolume } = renderVolumeBar({ volume: 0.5 });

    fireEvent.keyDown(slider, { key: "ArrowUp" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });

    expect(setVolume).toHaveBeenNthCalledWith(1, 0.55);
    expect(setLiveVolume).toHaveBeenNthCalledWith(1, 0.55);
    expect(setVolume).toHaveBeenNthCalledWith(2, 0.45);
  });

  it("displays zero while muted", () => {
    const { slider } = renderVolumeBar({ volume: 0.7, isMuted: true });

    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("does not toggle mute from wheel/keyboard — provider unmutes via setVolume", () => {
    // provider의 setVolume은 isMuted := (v === 0)으로 갱신하므로, 여기서
    // toggleMute까지 호출하면 이중 반전되어 뮤트 상태로 되돌아간다.
    const { slider, toggleMute, setVolume } = renderVolumeBar({
      volume: 0.5,
      isMuted: true,
    });

    fireEvent.wheel(slider, { deltaY: -100 });
    fireEvent.keyDown(slider, { key: "ArrowUp" });

    expect(setVolume).toHaveBeenCalled();
    expect(toggleMute).not.toHaveBeenCalled();
  });
});
