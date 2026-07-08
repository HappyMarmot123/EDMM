type CrossfadeDirection = "fadeIn" | "fadeOut";
export type CrossfadeCurve = "linear" | "equalPower";

export type CrossfadePoint = {
  atTime: number;
  gain: number;
};

type CrossfadeOptions = {
  direction: CrossfadeDirection;
  startTime: number;
  durationSec: number;
  curve?: CrossfadeCurve;
};

const MIN_GAIN = 0;
const MAX_GAIN = 1;

const clampGain = (gain: number): number =>
  Math.min(MAX_GAIN, Math.max(MIN_GAIN, gain));

const clampTime = (time: number): number => (Number.isFinite(time) ? Math.max(0, time) : 0);

const clampDuration = (durationSec: number): number =>
  Number.isFinite(durationSec) ? Math.max(0, durationSec) : 0;

export function computeFade({
  direction,
  startTime,
  durationSec,
  curve = "linear",
}: CrossfadeOptions): readonly CrossfadePoint[] {
  const from = direction === "fadeIn" ? MIN_GAIN : MAX_GAIN;
  const to = direction === "fadeIn" ? MAX_GAIN : MIN_GAIN;
  const normalizedStart = clampTime(startTime);
  const normalizedDuration = clampDuration(durationSec);
  const normalizedEnd = normalizedStart + normalizedDuration;

  if (normalizedDuration === 0) {
    return [
      {
        atTime: normalizedStart,
        gain: to,
      },
    ];
  }

  if (curve === "equalPower") {
    return [
      {
        atTime: normalizedStart,
        gain: clampGain(from),
      },
      {
        atTime: normalizedStart + normalizedDuration / 2,
        gain: Math.SQRT1_2,
      },
      {
        atTime: normalizedEnd,
        gain: clampGain(to),
      },
    ];
  }

  return [
    {
      atTime: normalizedStart,
      gain: clampGain(from),
    },
    {
      atTime: normalizedEnd,
      gain: clampGain(to),
    },
  ];
}

export function applyCrossfadeSchedule(
  gainNode: GainNode,
  points: readonly CrossfadePoint[],
) {
  points.forEach(({ atTime, gain }, index) => {
    const normalizedTime = clampTime(atTime);
    const normalizedGain = clampGain(gain);

    if (index === 0) {
      gainNode.gain.setValueAtTime(normalizedGain, normalizedTime);
      return;
    }

    gainNode.gain.linearRampToValueAtTime(normalizedGain, normalizedTime);
  });
}

