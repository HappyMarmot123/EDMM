import type { SyncedLyricLine } from "./types";

const OFFSET_TAG = /\[offset:\s*([+-]?\d+)\s*\]/gi;
const TIMESTAMP_TAG = /\[(\d{1,3}):([0-5]?\d)(?:[.:](\d{1,3}))?\]/g;

export class InvalidLrcError extends Error {
  constructor() {
    super("Invalid synchronized lyrics");
    this.name = "InvalidLrcError";
  }
}

const fractionToMilliseconds = (fraction: string | undefined) => {
  if (!fraction) return 0;
  if (fraction.length === 1) return Number(fraction) * 100;
  if (fraction.length === 2) return Number(fraction) * 10;
  return Number(fraction.slice(0, 3));
};

const readOffset = (lrc: string) => {
  let offsetMs = 0;

  for (const match of lrc.matchAll(OFFSET_TAG)) {
    offsetMs = Number(match[1]);
  }

  return offsetMs;
};

export const parseLrc = (
  lrc: string,
  durationMs: number,
): SyncedLyricLine[] => {
  if (
    typeof lrc !== "string" ||
    !lrc.trim() ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    throw new InvalidLrcError();
  }

  const normalizedDurationMs = Math.round(durationMs);
  const offsetMs = readOffset(lrc);
  const timedEvents: Array<{ startMs: number; text: string; order: number }> = [];
  let order = 0;

  for (const rawLine of lrc.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(TIMESTAMP_TAG)];
    if (matches.length === 0) continue;

    const text = rawLine.replace(TIMESTAMP_TAG, "").trim();

    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fractionMs = fractionToMilliseconds(match[3]);
      const rawStartMs = (minutes * 60 + seconds) * 1_000 + fractionMs;
      const startMs = Math.max(0, rawStartMs + offsetMs);

      if (startMs < normalizedDurationMs) {
        timedEvents.push({ startMs, text, order });
        order += 1;
      }
    }
  }

  if (!timedEvents.some((event) => Boolean(event.text))) {
    throw new InvalidLrcError();
  }

  timedEvents.sort(
    (left, right) => left.startMs - right.startMs || left.order - right.order,
  );

  return timedEvents
    .filter((event) => Boolean(event.text))
    .map((cue) => {
      let endMs = normalizedDurationMs;

      for (const nextEvent of timedEvents) {
        if (nextEvent.startMs > cue.startMs) {
          endMs = nextEvent.startMs;
          break;
        }
      }

      return { startMs: cue.startMs, endMs, text: cue.text };
    });
};
