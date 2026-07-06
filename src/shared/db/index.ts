export { db, EDMMDatabase } from "./edmmDB";
export type {
  FavoriteRow,
  AudioSettingsRow,
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
  getRecentPlaysResult,
} from "./repositories/recentPlaysRepo";
export {
  cacheTrack,
  getCachedTrack,
  getCachedTracks,
  getCachedTracksResult,
} from "./repositories/trackCacheRepo";
export {
  getEqualizerPreset,
  setEqualizerPreset,
} from "./repositories/audioSettingsRepo";
