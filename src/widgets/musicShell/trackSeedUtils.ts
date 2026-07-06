import { isPlayable, type Track } from "@/entities/track";
import { normalizeArtworkUrl } from "@/shared/lib/trackArtwork";

export const dedupeIds = (ids: Iterable<string>) => [...new Set(ids)];

export const firstPlayableTrack = (tracks: Track[]): Track | null =>
  tracks.find((track) => isPlayable(track)) ?? null;

export const findTrackById = (
  tracks: Track[],
  trackId: string | null,
): Track | null =>
  trackId ? tracks.find((track) => track.id === trackId) ?? null : null;

export const buildRecentSeedKey = (
  latestRecentId: string | null,
  firstVisibleTrackId: string | null,
) =>
  latestRecentId
    ? `recent:${latestRecentId}:first:${firstVisibleTrackId ?? "none"}`
    : `first:${firstVisibleTrackId}`;

export const buildTrackSeedFingerprint = (track: Track, queue: Track[]) => {
  const queueFingerprint = queue.map((queueTrack) => queueTrack.id).join(",");
  return `${track.id}|${normalizeArtworkUrl(track.artworkUrl)}|${queueFingerprint}`;
};

export const buildVisibleTrackFingerprint = (track: Track | null) =>
  track ? `${track.id}|${normalizeArtworkUrl(track.artworkUrl)}` : "none";

export const resolveInitialSeedTrack = ({
  selectedTrackId,
  selectedTrack,
  visibleTracks,
  cachedTrack,
}: {
  selectedTrackId: string | null;
  selectedTrack: Track | null;
  visibleTracks: Track[];
  cachedTrack: Track | null;
}): Track | null => {
  if (!selectedTrackId) {
    return null;
  }

  if (selectedTrack && isPlayable(selectedTrack)) {
    return selectedTrack;
  }

  if (!selectedTrack) {
    const visibleMatch = findTrackById(visibleTracks, selectedTrackId);
    if (visibleMatch && isPlayable(visibleMatch)) {
      return visibleMatch;
    }

    if (cachedTrack && isPlayable(cachedTrack)) {
      return cachedTrack;
    }
  }

  return firstPlayableTrack(visibleTracks);
};

export const resolveRecentSeedTrack = ({
  latestRecentId,
  visibleTracks,
}: {
  latestRecentId: string;
  visibleTracks: Track[];
}): Track | null => {
  const visibleMatch = findTrackById(visibleTracks, latestRecentId);
  if (visibleMatch && isPlayable(visibleMatch)) {
    return visibleMatch;
  }

  return firstPlayableTrack(visibleTracks);
};

type TrackCacheLookup = (trackId: string) => Promise<Track | null>;

export const resolveInitialSeedTrackWithCache = async ({
  selectedTrackId,
  selectedTrack,
  visibleTracks,
  loadTrackById,
}: {
  selectedTrackId: string | null;
  selectedTrack: Track | null;
  visibleTracks: Track[];
  loadTrackById: TrackCacheLookup;
}): Promise<Track | null> => {
  if (!selectedTrackId) {
    return null;
  }

  if (selectedTrack && isPlayable(selectedTrack)) {
    return selectedTrack;
  }

  const visibleMatch = findTrackById(visibleTracks, selectedTrackId);
  if (visibleMatch && isPlayable(visibleMatch)) {
    return visibleMatch;
  }

  try {
    const cachedTrack = await loadTrackById(selectedTrackId);
    if (cachedTrack && isPlayable(cachedTrack)) {
      return cachedTrack;
    }
  } catch {
    // keep fallback behavior deterministic
  }

  return firstPlayableTrack(visibleTracks);
};

export const resolveRecentSeedTrackWithCache = async ({
  latestRecentId,
  visibleTracks,
}: {
  latestRecentId: string;
  visibleTracks: Track[];
  loadTrackById: TrackCacheLookup;
}): Promise<Track | null> => {
  return resolveRecentSeedTrack({ latestRecentId, visibleTracks });
};
