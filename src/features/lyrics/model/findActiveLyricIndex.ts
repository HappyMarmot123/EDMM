import type { SyncedLyricLine } from "@/shared/lib/lyrics";

/**
 * Finds the last cue whose start is at or before the supplied time, then
 * verifies that the cue has not ended. Choosing the last matching start makes
 * duplicate LRC timestamps deterministic while keeping the lookup O(log n).
 */
export const findActiveLyricIndex = (
  lines: readonly SyncedLyricLine[],
  currentTimeMs: number,
) => {
  if (lines.length === 0 || !Number.isFinite(currentTimeMs)) {
    return -1;
  }

  let low = 0;
  let high = lines.length - 1;
  let candidate = -1;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);

    if (lines[middle].startMs <= currentTimeMs) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  if (candidate < 0) {
    return -1;
  }

  const cue = lines[candidate];
  return currentTimeMs < cue.endMs ? candidate : -1;
};
