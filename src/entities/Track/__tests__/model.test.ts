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

  it("allows Cloudinary tracks to be playable", () => {
    const track: Track = {
      id: "cloudinary:asset-1",
      source: "cloudinary",
      title: "Cloud Track",
      artistId: "cloudinary",
      artistName: "Cloudinary",
      artworkUrl: "",
      durationMs: 1000,
      streamUrl: "https://res.cloudinary.com/demo/video/upload/song.mp3",
      metadata: {},
    };

    expect(isPlayable(track)).toBe(true);
  });
});
