import type { Track } from "@/entities/track/model";

export interface DeezerTrackRaw {
  id?: number | string | null;
  title?: string | null;
  duration?: number | null;
  artist?: {
    id?: number | string | null;
    name?: string | null;
  } | null;
  album?: {
    title?: string | null;
    cover_medium?: string | null;
  } | null;
  preview?: string | null;
}

export function adaptDeezerTrack(raw: DeezerTrackRaw): Track {
  const artistId = raw.artist?.id;
  const duration = raw.duration;

  return {
    id: `deezer:${raw.id}`,
    source: "deezer",
    title: raw.title ?? "Untitled",
    artistId: artistId == null ? "unknown" : String(artistId),
    artistName: raw.artist?.name ?? "Unknown Artist",
    albumName: raw.album?.title ?? "Unknown Album",
    artworkUrl: raw.album?.cover_medium ?? "",
    durationMs:
      typeof duration === "number" && Number.isFinite(duration)
        ? duration * 1000
        : 0,
    streamUrl: raw.preview ?? "",
    metadata: { rawId: raw.id },
  };
}
