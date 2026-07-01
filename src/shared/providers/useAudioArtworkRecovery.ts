"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import type { Track } from "@/entities/track";
import { getCachedTrack } from "@/shared/db";
import {
  normalizeArtworkUrl,
  resolveArtworkUrlWithCache,
} from "@/shared/lib/trackArtwork";

type TrackRef = {
  current: Track | null;
};

type UseAudioArtworkRecoveryParams = {
  currentTrackRef: TrackRef;
  setCurrentTrack: Dispatch<SetStateAction<Track | null>>;
  setQueue: Dispatch<SetStateAction<Track[]>>;
};

export function useAudioArtworkRecovery({
  currentTrackRef,
  setCurrentTrack,
  setQueue,
}: UseAudioArtworkRecoveryParams) {
  const trackArtworkCacheRef = useRef(new Map<string, string>());
  const artworkRecoveryAttemptRef = useRef(new Map<string, number>());
  const artworkRecoveryRunningRef = useRef(new Set<string>());

  const cacheArtwork = useCallback((track: Track) => {
    const artworkUrl = normalizeArtworkUrl(track.artworkUrl);
    if (artworkUrl) {
      trackArtworkCacheRef.current.set(track.id, artworkUrl);
    }
  }, []);

  const getRememberedArtwork = useCallback((trackId: string) => {
    return trackArtworkCacheRef.current.get(trackId);
  }, []);

  const clearArtworkRecovery = useCallback((trackId: string) => {
    artworkRecoveryAttemptRef.current.delete(trackId);
    artworkRecoveryRunningRef.current.delete(trackId);
  }, []);

  const resolveTrackArtwork = useCallback(
    async (track: Track, fallbackArtworkId = ""): Promise<Track> => {
      const directArtwork = normalizeArtworkUrl(track.artworkUrl);
      if (directArtwork) {
        const trackWithArtwork = { ...track, artworkUrl: directArtwork };
        cacheArtwork(trackWithArtwork);
        return trackWithArtwork;
      }

      const normalizedFallback = normalizeArtworkUrl(fallbackArtworkId);
      if (normalizedFallback) {
        return { ...track, artworkUrl: normalizedFallback };
      }

      const rememberedArtwork = normalizeArtworkUrl(
        trackArtworkCacheRef.current.get(track.id),
      );
      if (rememberedArtwork) {
        return { ...track, artworkUrl: rememberedArtwork };
      }

      const resolvedArtwork = normalizeArtworkUrl(
        await resolveArtworkUrlWithCache(track),
      );
      if (resolvedArtwork) {
        cacheArtwork({ ...track, artworkUrl: resolvedArtwork });
      }

      return { ...track, artworkUrl: resolvedArtwork };
    },
    [cacheArtwork],
  );

  const recoverArtworkForCurrentTrack = useCallback(
    async (assetId: string) => {
      if (!assetId) return;

      const normalizedId = assetId;
      if (artworkRecoveryRunningRef.current.has(normalizedId)) return;

      const previousAttempts =
        artworkRecoveryAttemptRef.current.get(normalizedId) ?? 0;
      if (previousAttempts >= 4) return;

      artworkRecoveryRunningRef.current.add(normalizedId);
      try {
        for (let attempt = previousAttempts; attempt < 4; attempt++) {
          if (currentTrackRef.current?.id !== normalizedId) {
            break;
          }

          const cachedTrack = await getCachedTrack(normalizedId).catch(
            () => undefined,
          );
          const resolvedArtwork = normalizeArtworkUrl(cachedTrack?.artworkUrl);

          if (resolvedArtwork) {
            setCurrentTrack((previousTrack) => {
              if (!previousTrack || previousTrack.id !== normalizedId) {
                return previousTrack;
              }

              if (previousTrack.artworkUrl) {
                return previousTrack;
              }

              const patchedTrack = {
                ...previousTrack,
                artworkUrl: resolvedArtwork,
              };
              cacheArtwork(patchedTrack);
              return patchedTrack;
            });

            setQueue((previousQueue) => {
              if (previousQueue.every((item) => item.id !== normalizedId)) {
                return previousQueue;
              }

              return previousQueue.map((item) =>
                item.id === normalizedId
                  ? { ...item, artworkUrl: resolvedArtwork }
                  : item,
              );
            });
            trackArtworkCacheRef.current.set(normalizedId, resolvedArtwork);
            artworkRecoveryAttemptRef.current.delete(normalizedId);
            return;
          }

          if (attempt < 3) {
            artworkRecoveryAttemptRef.current.set(normalizedId, attempt + 1);
            await new Promise<void>((resolve) =>
              setTimeout(() => {
                resolve();
              }, 250 * (attempt + 1)),
            );
          } else {
            artworkRecoveryAttemptRef.current.set(normalizedId, attempt + 1);
          }
        }
      } finally {
        artworkRecoveryRunningRef.current.delete(normalizedId);
      }
    },
    [cacheArtwork, currentTrackRef, setCurrentTrack, setQueue],
  );

  return {
    cacheArtwork,
    clearArtworkRecovery,
    getRememberedArtwork,
    recoverArtworkForCurrentTrack,
    resolveTrackArtwork,
  };
}
