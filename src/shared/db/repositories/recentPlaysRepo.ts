import { db, type RecentPlayRow } from "@/shared/db/edmmDB";
import { logger } from "@/shared/lib/logger";

const RECENT_PLAYS_LIMIT = 10;

export type RecentPlaysResult = {
  recentPlays: RecentPlayRow[];
  unavailable: boolean;
};

export async function addRecentPlay(trackId: string): Promise<void> {
  try {
    await db.transaction("rw", db.recentPlays, async () => {
      await db.recentPlays.where("trackId").equals(trackId).delete();

      await db.recentPlays.add({
        trackId,
        playedAt: Date.now(),
      });

      const extraRows = await db.recentPlays
        .orderBy("playedAt")
        .limit(Math.max(0, (await db.recentPlays.count()) - RECENT_PLAYS_LIMIT))
        .primaryKeys();

      if (extraRows.length > 0) {
        await db.recentPlays.bulkDelete(extraRows as number[]);
      }
    });
  } catch (error) {
    logger.debug("Failed to record recent play:", error);
  }
}

export async function getRecentPlays(): Promise<RecentPlayRow[]> {
  const result = await getRecentPlaysResult();
  return result.recentPlays;
}

export async function getRecentPlaysResult(): Promise<RecentPlaysResult> {
  try {
    return {
      recentPlays: await db.recentPlays.orderBy("playedAt").reverse().toArray(),
      unavailable: false,
    };
  } catch {
    return {
      recentPlays: [],
      unavailable: true,
    };
  }
}
