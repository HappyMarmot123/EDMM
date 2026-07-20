export type SyncedLyricLine = {
  startMs: number;
  endMs: number;
  text: string;
};

export type SyncedLyricsDocument = {
  trackId: string;
  source: "lrclib";
  providerId: number;
  instrumental: boolean;
  durationMs: number;
  lines: SyncedLyricLine[];
};
