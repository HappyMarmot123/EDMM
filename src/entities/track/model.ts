export type TrackSource = "cloudinary";

export interface Track {
  id: string;
  source: TrackSource;
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
  if (typeof t.streamUrl !== "string" || t.streamUrl.trim().length === 0) {
    return false;
  }

  const resourceType = typeof t.metadata?.resourceType === "string"
    ? t.metadata.resourceType.toLowerCase()
    : "video";

  return resourceType !== "image";
}
