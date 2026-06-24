import { adaptAudiusTrack, type AudiusTrackRaw } from "../audiusAdapter";

const raw: AudiusTrackRaw = {
  id: "abc",
  title: "Song",
  user: { id: "u1", name: "DJ" },
  duration: 180,
  artwork: { "480x480": "https://art/480.jpg" },
};

describe("adaptAudiusTrack", () => {
  it("normalizes audius track to domain Track", () => {
    const t = adaptAudiusTrack(raw);
    expect(t).toEqual({
      id: "audius:abc",
      source: "audius",
      title: "Song",
      artistId: "u1",
      artistName: "DJ",
      artworkUrl: "https://art/480.jpg",
      durationMs: 180000,
      streamUrl: "/api/audius/stream/abc",
      metadata: { rawId: "abc" },
    });
  });

  it("uses 150x150 artwork when 480x480 is missing", () => {
    const t = adaptAudiusTrack({
      ...raw,
      artwork: { "150x150": "https://art/150.jpg" },
    });

    expect(t.artworkUrl).toBe("https://art/150.jpg");
  });

  it('returns "" when artwork is missing', () => {
    const t = adaptAudiusTrack({
      id: "abc",
      title: "Song",
      user: { id: "u1", name: "DJ" },
      duration: 180,
    });

    expect(t.artworkUrl).toBe("");
  });

  it('returns "" when artwork is null', () => {
    const t = adaptAudiusTrack({
      ...raw,
      artwork: null,
    });

    expect(t.artworkUrl).toBe("");
  });
});
