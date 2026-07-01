import { applyCrossfadeSchedule, computeFade } from "@/shared/lib/crossfade";

describe("computeFade", () => {
  it("returns fade-in points from 0 to 1", () => {
    expect(computeFade({ direction: "fadeIn", startTime: 1.5, durationSec: 3 })).toEqual([
      { atTime: 1.5, gain: 0 },
      { atTime: 4.5, gain: 1 },
    ]);
  });

  it("returns fade-out points from 1 to 0", () => {
    expect(computeFade({ direction: "fadeOut", startTime: 2, durationSec: 4 })).toEqual([
      { atTime: 2, gain: 1 },
      { atTime: 6, gain: 0 },
    ]);
  });

  it("handles zero-length fade as immediate target", () => {
    expect(computeFade({ direction: "fadeOut", startTime: 3, durationSec: 0 })).toEqual([
      { atTime: 3, gain: 0 },
    ]);
  });

  it("clamps negative durations and times", () => {
    expect(computeFade({ direction: "fadeIn", startTime: -1, durationSec: -2 })).toEqual([
      { atTime: 0, gain: 1 },
    ]);
  });
});

describe("applyCrossfadeSchedule", () => {
  it("writes immediate set then ramp values onto gain node", () => {
    const setValueAtTime = jest.fn();
    const linearRampToValueAtTime = jest.fn();

    applyCrossfadeSchedule(
      {
        gain: {
          setValueAtTime,
          linearRampToValueAtTime,
        },
      } as unknown as GainNode,
      [
        { atTime: 1, gain: 0 },
        { atTime: 3, gain: 1 },
      ],
    );

    expect(setValueAtTime).toHaveBeenCalledWith(0, 1);
    expect(linearRampToValueAtTime).toHaveBeenCalledWith(1, 3);
  });
});

