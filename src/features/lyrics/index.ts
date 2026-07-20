export { default as FullscreenLyricsPanel } from "./components/fullscreenLyricsPanel";
export type {
  FullscreenLyricsPanelLayout,
  FullscreenLyricsPanelProps,
  LyricsQueryState,
} from "./components/fullscreenLyricsPanel";
export { fetchLyrics, useLyrics } from "./hooks/useLyrics";
export type {
  LyricsRequest,
  LyricsTrack,
  UseLyricsOptions,
} from "./hooks/useLyrics";
export { findActiveLyricIndex } from "./model/findActiveLyricIndex";
