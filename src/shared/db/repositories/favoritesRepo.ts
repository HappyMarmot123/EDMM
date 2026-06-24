import { db, type FavoriteRow } from "@/shared/db/edmmDB";

export async function isFavorite(trackId: string): Promise<boolean> {
  const count = await db.favorites.where("trackId").equals(trackId).count();
  return count > 0;
}

export async function addFavorite(trackId: string): Promise<void> {
  try {
    await db.transaction("rw", db.favorites, async () => {
      const existing = await db.favorites.where("trackId").equals(trackId).first();

      if (existing) {
        return;
      }

      await db.favorites.add({
        trackId,
        addedAt: Date.now(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ConstraintError") {
      return;
    }

    throw error;
  }
}

export async function removeFavorite(trackId: string): Promise<void> {
  await db.favorites.where("trackId").equals(trackId).delete();
}

export async function toggleFavorite(trackId: string): Promise<boolean> {
  return db.transaction("rw", db.favorites, async () => {
    const existing = await db.favorites.where("trackId").equals(trackId).first();

    if (existing) {
      await db.favorites.where("trackId").equals(trackId).delete();
      return false;
    }

    await db.favorites.add({
      trackId,
      addedAt: Date.now(),
    });

    return true;
  });
}

export async function getAllFavorites(): Promise<FavoriteRow[]> {
  return db.favorites.orderBy("addedAt").reverse().toArray();
}
