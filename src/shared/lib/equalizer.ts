import { logger } from "@/shared/lib/logger";

const MIN_DB_GAIN = -24;
const MAX_DB_GAIN = 24;

export type EQPresetName = "flat" | "bass";

export interface EQBand {
  frequency: number;
  type: BiquadFilterType;
  q: number;
  gain: number;
}

export interface EqualizerConfig {
  bands: readonly Omit<EQBand, "gain">[];
  presets: Record<EQPresetName, readonly number[]>;
  preamp: Record<EQPresetName, number>;
  limiter: LimiterSettings;
}

export interface LimiterSettings {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
}

export const EQ_BANDS: readonly Omit<EQBand, "gain">[] = [
  { frequency: 32, type: "lowshelf", q: 0.7 },
  { frequency: 64, type: "peaking", q: 1.1 },
  { frequency: 125, type: "peaking", q: 1.1 },
  { frequency: 250, type: "peaking", q: 1.1 },
  { frequency: 500, type: "peaking", q: 1.1 },
  { frequency: 1000, type: "peaking", q: 1.1 },
  { frequency: 2000, type: "peaking", q: 1.1 },
  { frequency: 4000, type: "peaking", q: 1.1 },
  { frequency: 8000, type: "peaking", q: 1.1 },
  { frequency: 16000, type: "highshelf", q: 0.7 },
];

export const EQ_PRESET_GAINS: Record<EQPresetName, readonly number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass: [8, 7, 5, 2, 0, -1, -1, 0, 1, 2],
};

export const EQ_PRESET_PREAMP_DB: Record<EQPresetName, number> = {
  flat: 0,
  bass: -5,
};

export const LIMITER_SETTINGS: LimiterSettings = {
  threshold: -1,
  knee: 0,
  ratio: 20,
  attack: 0.003,
  release: 0.25,
};

export const EQ_CONFIG: EqualizerConfig = {
  bands: EQ_BANDS,
  presets: EQ_PRESET_GAINS,
  preamp: EQ_PRESET_PREAMP_DB,
  limiter: LIMITER_SETTINGS,
};

export const clampGain = (gain: number): number =>
  Math.min(MAX_DB_GAIN, Math.max(MIN_DB_GAIN, gain));

export const dbToLinearGain = (db: number): number => 10 ** (db / 20);

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

export function createPreampNode(audioContext: BaseAudioContext): GainNode {
  const preamp = audioContext.createGain();
  preamp.gain.value = 1;
  return preamp;
}

export function createLimiterNode(
  audioContext: BaseAudioContext,
): DynamicsCompressorNode {
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = LIMITER_SETTINGS.threshold;
  limiter.knee.value = LIMITER_SETTINGS.knee;
  limiter.ratio.value = LIMITER_SETTINGS.ratio;
  limiter.attack.value = LIMITER_SETTINGS.attack;
  limiter.release.value = LIMITER_SETTINGS.release;
  return limiter;
}

export function getPresetGainValues(
  preset: EQPresetName,
): readonly number[] {
  return EQ_PRESET_GAINS[preset];
}

export function getPresetPreampDb(preset: EQPresetName): number {
  return EQ_PRESET_PREAMP_DB[preset];
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

export function applyPreampForPreset(
  preset: EQPresetName,
  preamp: { gain: { value: number } },
): void {
  preamp.gain.value = dbToLinearGain(getPresetPreampDb(preset));
}
