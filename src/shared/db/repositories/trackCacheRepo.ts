import type { Track } from "@/entities/track";
import { db } from "@/shared/db/edmmDB";
import { logger } from "@/shared/lib/logger";

export async function cacheTrack(track: Track): Promise<void> {
  try {
    await db.trackCache.put({
      trackId: track.id,
      payload: track,
      cachedAt: Date.now(),
    });
  } catch (error) {
    logger.debug("Failed to cache track:", error);
  }
}

export async function getCachedTrack(
  trackId: string
): Promise<Track | undefined> {
  try {
    const row = await db.trackCache.get(trackId);
    return row?.payload;
  } catch {
    return undefined;
  }
}

export async function getCachedTracks(trackIds: string[]): Promise<Track[]> {
  try {
    const rows = await db.trackCache.bulkGet(trackIds);
    return rows.flatMap((row) => (row ? [row.payload] : []));
  } catch {
    return [];
  }
}
