import { logger } from "@/shared/lib/logger";

const MIN_DB_GAIN = -24;
const MAX_DB_GAIN = 24;

export type EQPresetName = "flat" | "edm" | "bass" | "vocal";

export interface EQBand {
  frequency: number;
  type: BiquadFilterType;
  q: number;
  gain: number;
}

export interface EqualizerConfig {
  bands: readonly Omit<EQBand, "gain">[];
  presets: Record<EQPresetName, readonly number[]>;
}

export const EQ_BANDS: readonly Omit<EQBand, "gain">[] = [
  { frequency: 60, type: "lowshelf", q: 0.7 },
  { frequency: 250, type: "peaking", q: 1 },
  { frequency: 1000, type: "peaking", q: 1 },
  { frequency: 4000, type: "peaking", q: 1 },
  { frequency: 12000, type: "highshelf", q: 0.7 },
];

export const EQ_PRESET_GAINS: Record<EQPresetName, readonly number[]> = {
  flat: [0, 0, 0, 0, 0],
  edm: [4, 2, 0, 3, 4],
  bass: [7, 1, -2, 2, 1],
  vocal: [-2, 1, 3, 3, 0],
};

export const EQ_CONFIG: EqualizerConfig = {
  bands: EQ_BANDS,
  presets: EQ_PRESET_GAINS,
};

export const clampGain = (gain: number): number =>
  Math.min(MAX_DB_GAIN, Math.max(MIN_DB_GAIN, gain));

export function createEqualizerFilters(
  audioContext: BaseAudioContext,
): BiquadFilterNode[] {
  return EQ_BANDS.map((band) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = band.type;
    filter.frequency.value = band.frequency;
    filter.Q.value = band.q;
    filter.gain.value = 0;
    return filter;
  });
}

export function getPresetGainValues(
  preset: EQPresetName,
): readonly number[] {
  return EQ_PRESET_GAINS[preset];
}

export function getDefaultPreset(): EQPresetName {
  return "flat";
}

export function applyEqualizerPreset(
  preset: EQPresetName,
  filters: BiquadFilterNode[],
): void {
  const gains = getPresetGainValues(preset);
  if (filters.length !== EQ_BANDS.length) {
    logger.warn(
      "Equalizer filter count mismatch.",
      `${filters.length} filters; expected ${EQ_BANDS.length}.`,
    );
  }

  filters.forEach((filter, index) => {
    const gain = gains[index] ?? 0;
    filter.gain.value = clampGain(gain);
  });
}

