import Dexie, { type Table } from "dexie";
import type { Track } from "@/entities/track";

export interface FavoriteRow {
  id?: number;
  trackId: string;
  addedAt: number;
}

export interface PlaylistRow {
  id?: number;
  name: string;
  createdAt: number;
}

export interface PlaylistTrackRow {
  id?: number;
  playlistId: number;
  trackId: string;
  order: number;
}

export interface RecentPlayRow {
  id?: number;
  trackId: string;
  playedAt: number;
}

export interface TrackCacheRow {
  trackId: string;
  payload: Track;
  cachedAt: number;
}

export class EDMMDatabase extends Dexie {
  favorites!: Table<FavoriteRow, number>;
  playlists!: Table<PlaylistRow, number>;
  playlistTracks!: Table<PlaylistTrackRow, number>;
  recentPlays!: Table<RecentPlayRow, number>;
  trackCache!: Table<TrackCacheRow, string>;

  constructor() {
    super("edmm");

    this.version(1).stores({
      favorites: "++id, &trackId, addedAt",
      playlists: "++id, name, createdAt",
      playlistTracks: "++id, playlistId, trackId, order",
      recentPlays: "++id, trackId, playedAt",
      trackCache: "trackId, cachedAt",
    });
  }
}

export const db = new EDMMDatabase();
