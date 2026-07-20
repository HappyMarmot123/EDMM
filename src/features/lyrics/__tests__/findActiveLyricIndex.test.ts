import { findActiveLyricIndex } from "../model/findActiveLyricIndex";
import type { SyncedLyricLine } from "@/shared/lib/lyrics";

const lines: SyncedLyricLine[] = [
  { startMs: 1_000, endMs: 2_000, text: "First" },
  { startMs: 2_500, endMs: 3_000, text: "Second" },
  { startMs: 3_000, endMs: 4_000, text: "Third" },
];

describe("findActiveLyricIndex", () => {
  it.each([
    ["before the first cue", 999, -1],
    ["at a cue start", 1_000, 0],
    ["inside a cue", 1_999, 0],
    ["at an exact cue end", 2_000, -1],
    ["inside a gap", 2_250, -1],
    ["at the next cue start", 2_500, 1],
    ["at a shared end and start", 3_000, 2],
    ["at the final cue end", 4_000, -1],
    ["after the final cue", 9_000, -1],
  ])("returns the expected index %s", (_case, timeMs, expected) => {
    expect(findActiveLyricIndex(lines, timeMs)).toBe(expected);
  });

  it("selects the last matching cue deterministically for duplicate starts", () => {
    const duplicateStarts: SyncedLyricLine[] = [
      { startMs: 1_000, endMs: 2_000, text: "First duplicate" },
      { startMs: 1_000, endMs: 2_000, text: "Second duplicate" },
      { startMs: 2_000, endMs: 3_000, text: "Next" },
    ];

    expect(findActiveLyricIndex(duplicateStarts, 1_000)).toBe(1);
    expect(findActiveLyricIndex(duplicateStarts, 1_999)).toBe(1);
  });

  it("is independent of forward and backward seeking history", () => {
    expect(findActiveLyricIndex(lines, 3_500)).toBe(2);
    expect(findActiveLyricIndex(lines, 1_500)).toBe(0);
    expect(findActiveLyricIndex(lines, 2_250)).toBe(-1);
    expect(findActiveLyricIndex(lines, 2_750)).toBe(1);
  });

  it("returns -1 for empty lines and non-finite times", () => {
    expect(findActiveLyricIndex([], 1_000)).toBe(-1);
    expect(findActiveLyricIndex(lines, Number.NaN)).toBe(-1);
    expect(findActiveLyricIndex(lines, Number.POSITIVE_INFINITY)).toBe(-1);
  });
});
