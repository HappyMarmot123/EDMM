import type { Track } from "@/entities/track/model";
import { db } from "../../edmmDB";
import {
  cacheTrack,
  getCachedTrack,
  getCachedTracks,
} from "../trackCacheRepo";

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "track-1",
  source: "cloudinary",
  title: "Phase 1 Track",
  artistId: "artist-1",
  artistName: "Phase 1 Artist",
  albumName: "Phase 1 Album",
  artworkUrl: "https://example.com/artwork.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/stream.mp3",
  metadata: { genre: "electronic" },
  ...overrides,
});

describe("trackCacheRepo", () => {
  it("caches and retrieves a track", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1234);
    const track = makeTrack();

    await cacheTrack(track);

    expect(await getCachedTrack(track.id)).toEqual(track);
    expect(await db.trackCache.get(track.id)).toEqual({
      trackId: track.id,
      payload: track,
      cachedAt: 1234,
    });
  });

  it("overwrites an existing cached track", async () => {
    await cacheTrack(makeTrack({ title: "Original title" }));
    const updatedTrack = makeTrack({ title: "Updated title" });

    await cacheTrack(updatedTrack);

    expect(await getCachedTrack(updatedTrack.id)).toEqual(updatedTrack);
  });

  it("returns cached tracks in input order and skips missing tracks", async () => {
    const trackA = makeTrack({ id: "a", title: "A" });
    const trackB = makeTrack({ id: "b", title: "B" });

    await cacheTrack(trackA);
    await cacheTrack(trackB);

    expect(await getCachedTracks(["b", "missing", "a"])).toEqual([
      trackB,
      trackA,
    ]);
  });

  it("returns undefined when reading a cached track fails", async () => {
    jest
      .spyOn(db.trackCache, "get")
      .mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    await expect(getCachedTrack("track-1")).resolves.toBeUndefined();
  });

  it("returns an empty list when reading cached tracks fails", async () => {
    jest
      .spyOn(db.trackCache, "bulkGet")
      .mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    await expect(getCachedTracks(["track-1"])).resolves.toEqual([]);
  });

  it("does not reject when writing a cached track fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest
      .spyOn(db.trackCache, "put")
      .mockRejectedValueOnce(new Error("Quota exceeded"));

    await expect(cacheTrack(makeTrack())).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to cache track:",
      expect.any(Error),
    );
  });
});
