import { Track, isPlayable } from "../model";

describe("Track model", () => {
  const base: Track = {
    id: "audius:1",
    source: "audius",
    title: "T",
    artistId: "a1",
    artistName: "A",
    artworkUrl: "u",
    durationMs: 1000,
    metadata: {},
  };

  it("isPlayable is false without streamUrl", () => {
    expect(isPlayable(base)).toBe(false);
  });

  it("isPlayable is false with an empty streamUrl", () => {
    expect(isPlayable({ ...base, streamUrl: "" })).toBe(false);
  });

  it("isPlayable is true with streamUrl", () => {
    expect(isPlayable({ ...base, streamUrl: "https://x" })).toBe(true);
  });
});
