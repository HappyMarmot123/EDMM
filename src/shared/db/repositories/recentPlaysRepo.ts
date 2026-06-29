import { db, type RecentPlayRow } from "@/shared/db/edmmDB";

const RECENT_PLAYS_LIMIT = 10;

const warnInDevelopment = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, error);
  }
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
    warnInDevelopment("Failed to record recent play:", error);
  }
}

export async function getRecentPlays(): Promise<RecentPlayRow[]> {
  try {
    return await db.recentPlays.orderBy("playedAt").reverse().toArray();
  } catch {
    return [];
  }
}
