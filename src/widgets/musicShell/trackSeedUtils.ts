import { isPlayable, type Track } from "@/entities/Track/model";

export const dedupeIds = (ids: Iterable<string>) => [...new Set(ids)];

export const firstPlayableTrack = (tracks: Track[]) =>
  tracks.find((track) => isPlayable(track)) ?? null;

export const findTrackById = (tracks: Track[], trackId: string | null): Track | null =>
  trackId ? tracks.find((track) => track.id === trackId) ?? null : null;

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
}) => {
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
  cachedTrack,
}: {
  latestRecentId: string;
  visibleTracks: Track[];
  cachedTrack: Track | null;
}) => {
  const visibleMatch = findTrackById(visibleTracks, latestRecentId);
  if (visibleMatch && isPlayable(visibleMatch)) {
    return visibleMatch;
  }

  if (cachedTrack && isPlayable(cachedTrack)) {
    return cachedTrack;
  }

  return firstPlayableTrack(visibleTracks);
};
