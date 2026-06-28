import { db, type RecentPlayRow } from "@/shared/db/edmmDB";

const RECENT_PLAYS_LIMIT = 10;

export async function addRecentPlay(trackId: string): Promise<void> {
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
}

export async function getRecentPlays(): Promise<RecentPlayRow[]> {
  return db.recentPlays.orderBy("playedAt").reverse().toArray();
}
