import { applyCrossfadeSchedule, computeFade } from "@/shared/lib/crossfade";

describe("computeFade", () => {
  it("keeps default linear behavior as two fade-in points", () => {
    expect(computeFade({ direction: "fadeIn", startTime: 1, durationSec: 2 })).toEqual([
      { atTime: 1, gain: 0 },
      { atTime: 3, gain: 1 },
    ]);
  });

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

  it("returns equal-power fade-in points with a midpoint", () => {
    const options = {
      direction: "fadeIn",
      startTime: 1,
      durationSec: 2,
      curve: "equalPower",
    } as const;

    expect(computeFade(options)).toEqual([
      { atTime: 1, gain: 0 },
      { atTime: 2, gain: Math.SQRT1_2 },
      { atTime: 3, gain: 1 },
    ]);
  });

  it("returns equal-power fade-out points with a midpoint", () => {
    const options = {
      direction: "fadeOut",
      startTime: 1,
      durationSec: 2,
      curve: "equalPower",
    } as const;

    expect(computeFade(options)).toEqual([
      { atTime: 1, gain: 1 },
      { atTime: 2, gain: Math.SQRT1_2 },
      { atTime: 3, gain: 0 },
    ]);
  });

  it("keeps zero-duration equal-power fades immediate without a midpoint", () => {
    const options = {
      direction: "fadeIn",
      startTime: 1,
      durationSec: 0,
      curve: "equalPower",
    } as const;

    expect(computeFade(options)).toEqual([{ atTime: 1, gain: 1 }]);
  });

  it("clamps negative durations and times", () => {
    expect(computeFade({ direction: "fadeIn", startTime: -1, durationSec: -2 })).toEqual([
      { atTime: 0, gain: 1 },
    ]);
  });

  it.each([
    {
      name: "NaN startTime",
      options: { direction: "fadeIn", startTime: Number.NaN, durationSec: 2 },
      expected: [
        { atTime: 0, gain: 0 },
        { atTime: 2, gain: 1 },
      ],
    },
    {
      name: "Infinity startTime",
      options: { direction: "fadeIn", startTime: Infinity, durationSec: 2 },
      expected: [
        { atTime: 0, gain: 0 },
        { atTime: 2, gain: 1 },
      ],
    },
    {
      name: "NaN durationSec",
      options: { direction: "fadeIn", startTime: 1, durationSec: Number.NaN },
      expected: [{ atTime: 1, gain: 1 }],
    },
    {
      name: "Infinity durationSec",
      options: { direction: "fadeIn", startTime: 1, durationSec: Infinity },
      expected: [{ atTime: 1, gain: 1 }],
    },
  ] as const)("clamps non-finite inputs for $name", ({ options, expected }) => {
    expect(computeFade(options)).toEqual(expected);
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

