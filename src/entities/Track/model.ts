export interface Track {
  id: string;
  source: "audius";
  title: string;
  artistId: string;
  artistName: string;
  albumName?: string;
  artworkUrl: string;
  durationMs: number;
  streamUrl?: string;
  metadata: Record<string, unknown>;
}

export function isPlayable(t: Track): boolean {
  return typeof t.streamUrl === "string" && t.streamUrl.length > 0;
}
