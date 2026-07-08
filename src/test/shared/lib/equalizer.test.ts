import { logger } from "@/shared/lib/logger";
import {
  applyEqualizerPreset,
  applyPreampForPreset,
  dbToLinearGain,
  EQ_BANDS,
  EQ_CONFIG,
  EQ_PRESET_GAINS,
  EQ_PRESET_PREAMP_DB,
  getDefaultPreset,
  getPresetGainValues,
  getPresetPreampDb,
  LIMITER_SETTINGS,
  type EQPresetName,
} from "@/shared/lib/equalizer";

describe("equalizer", () => {
  it("exposes 2 presets, 10 bands and flat default", () => {
    expect(getDefaultPreset()).toBe("flat");
    expect(EQ_CONFIG.bands).toHaveLength(10);
    expect(Object.keys(EQ_PRESET_GAINS)).toEqual(["flat", "bass"]);
  });

  it("uses 10-band ISO octave center frequencies", () => {
    expect(EQ_BANDS.map((band) => band.frequency)).toEqual([
      32,
      64,
      125,
      250,
      500,
      1000,
      2000,
      4000,
      8000,
      16000,
    ]);
    expect(EQ_BANDS[0].type).toBe("lowshelf");
    expect(EQ_BANDS[9].type).toBe("highshelf");
    expect(EQ_BANDS[5].type).toBe("peaking");
  });

  it("returns strong voiced gains per preset (length 10)", () => {
    expect(getPresetGainValues("flat")).toEqual([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    expect(getPresetGainValues("bass")).toEqual([
      8,
      7,
      5,
      2,
      0,
      -1,
      -1,
      0,
      1,
      2,
    ]);
    Object.values(EQ_PRESET_GAINS).forEach((gains) =>
      expect(gains).toHaveLength(10),
    );
  });

  it("provides per-preset preamp headroom (flat = 0dB, boosts negative)", () => {
    expect(getPresetPreampDb("flat")).toBe(0);
    expect(getPresetPreampDb("bass")).toBe(-5);
    expect(EQ_PRESET_PREAMP_DB.flat).toBe(0);
  });

  it("converts dB to linear gain", () => {
    expect(dbToLinearGain(0)).toBeCloseTo(1);
    expect(dbToLinearGain(-6)).toBeCloseTo(0.501, 3);
    expect(dbToLinearGain(-5)).toBeCloseTo(0.562, 3);
  });

  it("applies preamp linear gain for a preset onto a gain node", () => {
    const node = { gain: { value: 1 } };

    applyPreampForPreset("bass", node);
    expect(node.gain.value).toBeCloseTo(dbToLinearGain(-5));

    applyPreampForPreset("flat", node);
    expect(node.gain.value).toBeCloseTo(1);
  });

  it("applies gains to 10 filters and clamps", () => {
    const spy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const filters = Array.from({ length: 10 }, () => ({
      gain: { value: 0 },
    })) as unknown as BiquadFilterNode[];
    const preset: EQPresetName = "bass";

    applyEqualizerPreset(preset, filters);

    expect(filters.map((filter) => filter.gain.value)).toEqual(
      EQ_PRESET_GAINS.bass,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("defines soft limiter settings", () => {
    expect(LIMITER_SETTINGS).toEqual({
      threshold: -4,
      knee: 12,
      ratio: 8,
      attack: 0.008,
      release: 0.18,
    });
  });

  it("ramps equalizer gain changes when ramp options are supplied", () => {
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const gain = {
      value: 0,
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
    };
    const filter = { gain } as unknown as BiquadFilterNode;

    applyEqualizerPreset("bass", [filter], {
      currentTime: 2,
      durationSec: 0.1,
    });
    warnSpy.mockRestore();

    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(2);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0, 2);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(8, 2.1);
  });

  it("ramps preamp gain changes when ramp options are supplied", () => {
    const gain = {
      value: 1,
      cancelScheduledValues: jest.fn(() => {
        gain.value = 0.25;
      }),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
    };
    const node = { gain };

    applyPreampForPreset("bass", node, {
      currentTime: 3,
      durationSec: 0.12,
    });

    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(3);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(1, 3);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      dbToLinearGain(-5),
      3.12,
    );
  });

  it("holds active automation before ramping when supported", () => {
    const gain = {
      value: 1,
      cancelAndHoldAtTime: jest.fn(),
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
    };
    const node = { gain };

    applyPreampForPreset("bass", node, {
      currentTime: 3,
      durationSec: 0.12,
    });

    expect(gain.cancelAndHoldAtTime).toHaveBeenCalledWith(3);
    expect(gain.cancelScheduledValues).not.toHaveBeenCalled();
    expect(gain.setValueAtTime).not.toHaveBeenCalled();
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      dbToLinearGain(-5),
      3.12,
    );
    expect(
      gain.cancelAndHoldAtTime.mock.invocationCallOrder[0],
    ).toBeLessThan(gain.linearRampToValueAtTime.mock.invocationCallOrder[0]);
  });

  it("uses default ramp duration when duration is omitted", () => {
    const gain = {
      value: 0.5,
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
    };
    const node = { gain };

    applyPreampForPreset("flat", node, { currentTime: 4 });

    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(4);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.5, 4);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 4.08);
  });
});

