import type { Track } from "@/entities/Track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";

export const normalizeArtworkUrl = (value: string | undefined | null): string => {
  return value?.trim().length ? value.trim() : "";
};

export const pickArtworkUrl = (
  primary: string | undefined | null,
  fallback: string | undefined | null,
): string => {
  return normalizeArtworkUrl(primary) || normalizeArtworkUrl(fallback);
};

export const resolveArtworkUrlWithCache = async (track: Track): Promise<string> => {
  const directUrl = normalizeArtworkUrl(track.artworkUrl);
  if (directUrl) {
    return directUrl;
  }

  try {
    const cachedTrack = await getCachedTrack(track.id);
    return normalizeArtworkUrl(cachedTrack?.artworkUrl);
  } catch {
    return "";
  }
};
