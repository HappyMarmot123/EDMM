export { db, EDMMDatabase } from "./edmmDB";
export type {
  FavoriteRow,
  PlaylistRow,
  PlaylistTrackRow,
  RecentPlayRow,
  TrackCacheRow,
} from "./edmmDB";
export {
  addFavorite,
  getAllFavorites,
  isFavorite,
  removeFavorite,
  toggleFavorite,
} from "./repositories/favoritesRepo";
export {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  getPlaylistTracks,
} from "./repositories/playlistsRepo";
export {
  addRecentPlay,
  getRecentPlays,
} from "./repositories/recentPlaysRepo";
export {
  cacheTrack,
  getCachedTrack,
  getCachedTracks,
} from "./repositories/trackCacheRepo";
