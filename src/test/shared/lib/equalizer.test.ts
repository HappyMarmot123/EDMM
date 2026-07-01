import { logger } from "@/shared/lib/logger";
import {
  applyEqualizerPreset,
  EQ_BANDS,
  EQ_CONFIG,
  EQ_PRESET_GAINS,
  getDefaultPreset,
  getPresetGainValues,
  type EQPresetName,
} from "@/shared/lib/equalizer";

describe("equalizer", () => {
  it("exposes expected preset names and defaults", () => {
    expect(getDefaultPreset()).toBe("flat");
    expect(EQ_CONFIG.bands).toHaveLength(5);
    expect(Object.keys(EQ_PRESET_GAINS)).toEqual([
      "flat",
      "edm",
      "bass",
      "vocal",
    ]);
  });

  it("returns ordered gain values for a preset", () => {
    expect(getPresetGainValues("edm")).toEqual([4, 2, 0, 3, 4]);
  });

  it("applies gains only to matching filter count and clamps values", () => {
    const spy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const filters = [
      { gain: { value: 0 } },
      { gain: { value: 0 } },
      { gain: { value: 0 } },
      { gain: { value: 0 } },
      { gain: { value: 0 } },
    ] as unknown as BiquadFilterNode[];
    const preset: EQPresetName = "bass";

    applyEqualizerPreset(preset, filters);

    expect(filters.map((filter) => filter.gain.value)).toEqual([
      7,
      1,
      -2,
      2,
      1,
    ]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("uses configuration constants to define presets", () => {
    expect(EQ_CONFIG.presets.edm).toEqual(EQ_PRESET_GAINS.edm);
    expect(EQ_BANDS.map((band) => band.frequency)).toEqual([
      60,
      250,
      1000,
      4000,
      12000,
    ]);
  });
});

