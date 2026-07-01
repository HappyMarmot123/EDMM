import { db, type PlaylistRow } from "@/shared/db/edmmDB";

export async function createPlaylist(name: string): Promise<number> {
  return db.playlists.add({
    name,
    createdAt: Date.now(),
  });
}

export async function addTrackToPlaylist(
  playlistId: number,
  trackId: string
): Promise<void> {
  await db.transaction("rw", db.playlistTracks, async () => {
    const order = await db.playlistTracks
      .where("playlistId")
      .equals(playlistId)
      .count();

    await db.playlistTracks.add({
      playlistId,
      trackId,
      order,
    });
  });
}

export async function getPlaylistTracks(playlistId: number): Promise<string[]> {
  const playlistTracks = await db.playlistTracks
    .where("playlistId")
    .equals(playlistId)
    .sortBy("order");

  return playlistTracks.map((playlistTrack) => playlistTrack.trackId);
}

export async function getPlaylists(): Promise<PlaylistRow[]> {
  return db.playlists.orderBy("createdAt").reverse().toArray();
}
