import type { Track } from "@/entities/track";
import { db } from "@/shared/db/edmmDB";
import {
  captureIndexedDbUnavailableEvent,
  INDEXEDDB_OPERATIONS,
} from "@/shared/lib/sentry/indexedDbEvents";
import { logger } from "@/shared/lib/logger";

export type CachedTracksResult = {
  tracks: Track[];
  unavailable: boolean;
};

export async function cacheTrack(track: Track): Promise<void> {
  try {
    await db.trackCache.put({
      trackId: track.id,
      payload: track,
      cachedAt: Date.now(),
    });
  } catch (error) {
    captureIndexedDbUnavailableEvent({
      operation: INDEXEDDB_OPERATIONS.trackCacheWrite,
      retryable: false,
      trackId: track.id,
    });
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
  const result = await getCachedTracksResult(trackIds);
  return result.tracks;
}

export async function getCachedTracksResult(
  trackIds: string[],
): Promise<CachedTracksResult> {
  try {
    const rows = await db.trackCache.bulkGet(trackIds);
    return {
      tracks: rows.flatMap((row) => (row ? [row.payload] : [])),
      unavailable: false,
    };
  } catch {
    return {
      tracks: [],
      unavailable: true,
    };
  }
}
