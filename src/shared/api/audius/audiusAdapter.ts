import type { Track } from "@/entities/track/model";

export interface AudiusTrackRaw {
  id: string;
  title: string;
  user: {
    id: string;
    name: string;
  };
  duration: number;
  artwork?: Record<string, string> | null;
}

export function adaptAudiusTrack(raw: AudiusTrackRaw): Track {
  return {
    id: `audius:${raw.id}`,
    source: "audius",
    title: raw.title,
    artistId: raw.user.id,
    artistName: raw.user.name,
    durationMs: raw.duration * 1000,
    artworkUrl: raw.artwork?.["480x480"] ?? raw.artwork?.["150x150"] ?? "",
    streamUrl: `/api/audius/stream/${raw.id}`,
    metadata: { rawId: raw.id },
  };
}
