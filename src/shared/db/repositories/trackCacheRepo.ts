import type { Track } from "@/entities/track/model";
import { db } from "@/shared/db/edmmDB";

export async function cacheTrack(track: Track): Promise<void> {
  await db.trackCache.put({
    trackId: track.id,
    payload: track,
    cachedAt: Date.now(),
  });
}

export async function getCachedTrack(
  trackId: string
): Promise<Track | undefined> {
  const row = await db.trackCache.get(trackId);
  return row?.payload;
}

export async function getCachedTracks(trackIds: string[]): Promise<Track[]> {
  const rows = await db.trackCache.bulkGet(trackIds);
  return rows.flatMap((row) => (row ? [row.payload] : []));
}
