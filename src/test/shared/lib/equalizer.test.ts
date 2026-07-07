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
  it("exposes 3 presets, 10 bands and flat default", () => {
    expect(getDefaultPreset()).toBe("flat");
    expect(EQ_CONFIG.bands).toHaveLength(10);
    expect(Object.keys(EQ_PRESET_GAINS)).toEqual(["flat", "bass", "vocal"]);
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
    expect(getPresetGainValues("vocal")).toEqual([
      -4,
      -3,
      -2,
      0,
      1,
      3,
      4,
      5,
      3,
      1,
    ]);
    Object.values(EQ_PRESET_GAINS).forEach((gains) =>
      expect(gains).toHaveLength(10),
    );
  });

  it("provides per-preset preamp headroom (flat = 0dB, boosts negative)", () => {
    expect(getPresetPreampDb("flat")).toBe(0);
    expect(getPresetPreampDb("bass")).toBe(-5);
    expect(getPresetPreampDb("vocal")).toBe(-3);
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

  it("defines a transparent brickwall limiter", () => {
    expect(LIMITER_SETTINGS).toEqual({
      threshold: -1,
      knee: 0,
      ratio: 20,
      attack: 0.003,
      release: 0.25,
    });
  });
});

