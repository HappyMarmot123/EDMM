import { describe, expect, it } from "@jest/globals";
import {
  buildTrackSeedFingerprint,
  buildVisibleTrackFingerprint,
  resolveInitialSeedTrack,
  resolveRecentSeedTrack,
  dedupeIds,
} from "@/widgets/musicShell/trackSeedUtils";
import type { Track } from "@/entities/track";

const createTrack = (id: string, playable = true): Track => ({
  id,
  source: "cloudinary",
  title: `Track ${id}`,
  artistId: `artist-${id}`,
  artistName: `Artist ${id}`,
  albumName: "Album",
  artworkUrl: "https://example.com/artwork.jpg",
  durationMs: 120_000,
  streamUrl: playable ? `https://example.com/${id}.mp4` : undefined,
  metadata: { resourceType: "video" },
});

describe("trackSeedUtils", () => {
  it("dedupeIds removes duplicates while preserving order", () => {
    expect(dedupeIds(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("buildTrackSeedFingerprint includes normalized artwork and queue ids", () => {
    const track = createTrack("selected", true);
    const queue = [createTrack("selected"), createTrack("next")];

    expect(buildTrackSeedFingerprint(track, queue)).toBe(
      "selected|https://example.com/artwork.jpg|selected,next",
    );
  });

  it("buildVisibleTrackFingerprint returns none for missing visible tracks", () => {
    expect(buildVisibleTrackFingerprint(null)).toBe("none");
    expect(buildVisibleTrackFingerprint(createTrack("visible"))).toBe(
      "visible|https://example.com/artwork.jpg",
    );
  });

  it("resolveInitialSeedTrack prefers visible selected track when selected is already visible", () => {
    const selected = createTrack("selected-visible");
    const cached = createTrack("cached-selected");
    const visible = [selected, createTrack("other")];

    const resolved = resolveInitialSeedTrack({
      selectedTrackId: "selected-visible",
      selectedTrack: selected,
      visibleTracks: visible,
      cachedTrack: cached,
    });

    expect(resolved?.id).toBe("selected-visible");
  });

  it("resolveInitialSeedTrack uses cache when selected track is not visible", () => {
    const cached = createTrack("cached-only");
    const visible = [createTrack("other")];

    const resolved = resolveInitialSeedTrack({
      selectedTrackId: "cached-only",
      selectedTrack: null,
      visibleTracks: visible,
      cachedTrack: cached,
    });

    expect(resolved?.id).toBe("cached-only");
  });

  it("resolveInitialSeedTrack falls back to first playable visible track", () => {
    const visible = [createTrack("first", false), createTrack("second")];

    const resolved = resolveInitialSeedTrack({
      selectedTrackId: "missing",
      selectedTrack: null,
      visibleTracks: visible,
      cachedTrack: null,
    });

    expect(resolved?.id).toBe("second");
  });

  it("resolveRecentSeedTrack prefers a matching visible track", () => {
    const visibleMatch = createTrack("recent-visible");
    const cached = createTrack("recent-cached");

    const resolved = resolveRecentSeedTrack({
      latestRecentId: "recent-visible",
      visibleTracks: [visibleMatch, cached],
      cachedTrack: cached,
    });

    expect(resolved?.id).toBe("recent-visible");
  });

  it("resolveRecentSeedTrack falls back to cached track if no visible match", () => {
    const cached = createTrack("recent-cached");

    const resolved = resolveRecentSeedTrack({
      latestRecentId: "recent-cached",
      visibleTracks: [createTrack("other")],
      cachedTrack: cached,
    });

    expect(resolved?.id).toBe("recent-cached");
  });

  it("resolveRecentSeedTrack falls back to first playable track as final fallback", () => {
    const resolved = resolveRecentSeedTrack({
      latestRecentId: "recent-cached",
      visibleTracks: [createTrack("unplayable", false), createTrack("playable")],
      cachedTrack: createTrack("cached-unplayable", false),
    });

    expect(resolved?.id).toBe("playable");
  });
});
