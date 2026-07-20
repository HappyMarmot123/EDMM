import { InvalidLrcError, parseLrc } from "../lrcParser";

describe("parseLrc", () => {
  it("parses sorted cues and derives their end times from the next cue", () => {
    expect(
      parseLrc("[00:05.86]First line\n[00:12.100]Second line", 20_000),
    ).toEqual([
      { startMs: 5_860, endMs: 12_100, text: "First line" },
      { startMs: 12_100, endMs: 20_000, text: "Second line" },
    ]);
  });

  it("applies a global millisecond offset and clamps negative cue times", () => {
    expect(
      parseLrc("[offset:-750]\n[00:00.50]Opening\n[00:02.00]Verse", 5_000),
    ).toEqual([
      { startMs: 0, endMs: 1_250, text: "Opening" },
      { startMs: 1_250, endMs: 5_000, text: "Verse" },
    ]);
  });

  it("expands multiple timestamps attached to one lyric", () => {
    expect(
      parseLrc("[00:01.00][00:03.5]Repeat\n[00:05]Finish", 7_000),
    ).toEqual([
      { startMs: 1_000, endMs: 3_500, text: "Repeat" },
      { startMs: 3_500, endMs: 5_000, text: "Repeat" },
      { startMs: 5_000, endMs: 7_000, text: "Finish" },
    ]);
  });

  it("ignores metadata, empty cues, and cues outside the track duration", () => {
    expect(
      parseLrc(
        "[ar:Synthetic Artist]\n[00:01.00]   \n[00:02.00]Kept\n[00:10.00]Too late",
        10_000,
      ),
    ).toEqual([{ startMs: 2_000, endMs: 10_000, text: "Kept" }]);
  });

  it("uses an empty timed cue to terminate the preceding lyric", () => {
    expect(
      parseLrc(
        "[00:01.00]Visible\n[00:03.00]   \n[00:05.00]Visible again",
        8_000,
      ),
    ).toEqual([
      { startMs: 1_000, endMs: 3_000, text: "Visible" },
      { startMs: 5_000, endMs: 8_000, text: "Visible again" },
    ]);
  });

  it.each([
    ["empty input", ""],
    ["metadata only", "[ar:Synthetic Artist]\n[ti:Synthetic Song]"],
    ["malformed timestamps", "[not-a-time]Text\n[00:xx.00]Text"],
    ["only empty cues", "[00:01.00]   "],
  ])("rejects invalid LRC: %s", (_case, value) => {
    expect(() => parseLrc(value, 10_000)).toThrow(InvalidLrcError);
  });

  it("rejects an invalid track duration", () => {
    expect(() => parseLrc("[00:01.00]Line", 0)).toThrow(InvalidLrcError);
  });
});
