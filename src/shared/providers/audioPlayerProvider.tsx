"use client";

import type { Track } from "@/entities/track/model";
import { isPlayable } from "@/entities/track/model";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { cacheTrack, getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { addRecentPlay } from "@/shared/db/repositories/recentPlaysRepo";
import { CLAMP_VOLUME } from "@/shared/lib/util";
import { normalizeArtworkUrl, resolveArtworkUrlWithCache } from "@/shared/lib/trackArtwork";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import {
  AudioPlayerLogicReturnType,
  PlaybackError,
} from "@/shared/types/dataType";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const AudioPlayerContext = createContext<
  AudioPlayerLogicReturnType | undefined
>(undefined);

const classifyPlaybackError = (
  error: unknown,
  fallback: NonNullable<PlaybackError>,
): NonNullable<PlaybackError> => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "autoplay-blocked";
    }
    if (error.name === "NotSupportedError") {
      return "source-load-failed";
    }
  }

  return fallback;
};

function useAudioPlayerLogic(): AudioPlayerLogicReturnType {
  const audio = useAudioInstanceStore((state) => state.audioInstance);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const audioAnalyser = useAudioInstanceStore((state) => state.audioAnalyser);
  const audioCapabilities = useAudioInstanceStore(
    (state) => state.audioCapabilities
  );
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );
  const currentTrackRef = useRef<Track | null>(null);
  const trackArtworkCacheRef = useRef(new Map<string, string>());
  const playTrackRequestRef = useRef(0);
  const artworkRecoveryAttemptRef = useRef(new Map<string, number>());
  const artworkRecoveryRunningRef = useRef(new Set<string>());

  const isSeekingRef = useRef(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [playbackError, setPlaybackError] = useState<PlaybackError>(null);
  const [playbackQueue, setPlaybackQueue] = useState<Track[]>([]);
  const activeQueue = useMemo(
    () => (playbackQueue.length > 0 ? playbackQueue : queue),
    [playbackQueue, queue],
  );

  const buildShuffleQueue = useCallback((nextQueue: Track[], currentTrackId?: string) => {
    if (nextQueue.length <= 1) {
      return nextQueue;
    }

    const queueCopy = [...nextQueue];
    let currentTrackItem: Track | undefined;

    if (currentTrackId) {
      const index = queueCopy.findIndex((track) => track.id === currentTrackId);
      if (index >= 0) {
        [currentTrackItem] = queueCopy.splice(index, 1);
      }
    }

    for (let index = queueCopy.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [queueCopy[index], queueCopy[swapIndex]] = [
        queueCopy[swapIndex],
        queueCopy[index],
      ];
    }

    return currentTrackItem ? [currentTrackItem, ...queueCopy] : queueCopy;
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(CLAMP_VOLUME(nextVolume));
    setIsMuted(nextVolume === 0);
  }, []);

  const mergeTrack = useCallback(
    (existing: Track | null, next: Track): Track => {
      if (!existing || existing.id !== next.id) {
        return next;
      }

      return {
        ...existing,
        title: next.title || existing.title,
        artistId: next.artistId || existing.artistId,
        artistName: next.artistName || existing.artistName,
        albumName: next.albumName || existing.albumName,
        artworkUrl: normalizeArtworkUrl(next.artworkUrl) || existing.artworkUrl,
        durationMs: next.durationMs || existing.durationMs,
        streamUrl: next.streamUrl || existing.streamUrl,
        metadata: {
          ...existing.metadata,
          ...next.metadata,
        },
      };
    },
    [],
  );

  const cacheArtwork = useCallback((track: Track) => {
    const artworkUrl = normalizeArtworkUrl(track.artworkUrl);
    if (artworkUrl) {
      trackArtworkCacheRef.current.set(track.id, artworkUrl);
    }
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

  const recoverArtworkForCurrentTrack = useCallback(async (assetId: string) => {
    if (!assetId) return;

    const normalizedId = assetId;
    if (artworkRecoveryRunningRef.current.has(normalizedId)) return;

    const previousAttempts = artworkRecoveryAttemptRef.current.get(normalizedId) ?? 0;
    if (previousAttempts >= 4) return;

    artworkRecoveryRunningRef.current.add(normalizedId);
    try {
      for (let attempt = previousAttempts; attempt < 4; attempt++) {
        if (currentTrackRef.current?.id !== normalizedId) {
          break;
        }

        const cachedTrack = await getCachedTrack(normalizedId).catch(() => undefined);
        const resolvedArtwork = normalizeArtworkUrl(cachedTrack?.artworkUrl);

        if (resolvedArtwork) {
          setCurrentTrack((previousTrack) => {
            if (!previousTrack || previousTrack.id !== normalizedId) {
              return previousTrack;
            }

            if (previousTrack.artworkUrl) {
              return previousTrack;
            }

            const patchedTrack = { ...previousTrack, artworkUrl: resolvedArtwork };
            cacheArtwork(patchedTrack);
            return patchedTrack;
          });

          setQueue((previousQueue) => {
            if (previousQueue.every((item) => item.id !== normalizedId)) {
              return previousQueue;
            }

            return previousQueue.map((item) =>
              item.id === normalizedId ? { ...item, artworkUrl: resolvedArtwork } : item,
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
  }, [cacheArtwork]);

  const setLiveVolume = useCallback(
    (nextVolume: number) => {
      if (audio) {
        audio.volume = CLAMP_VOLUME(nextVolume);
      }
    },
    [audio]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => !muted);
  }, []);

  const setTrack = useCallback(
    (track: Track, playImmediately = false) => {
      const mergedTrack = mergeTrack(currentTrackRef.current, track);

      cacheArtwork(mergedTrack);
      setCurrentTrack(mergedTrack);
      setCurrentTime(0);
      setIsBuffering(playImmediately && isPlayable(mergedTrack));
      setIsPlaying(playImmediately && isPlayable(mergedTrack));
    },
    [cacheArtwork, mergeTrack],
  );

  const toggleShuffle = useCallback(() => {
    const nextShuffleState = !isShuffleEnabled;
    setIsShuffleEnabled(nextShuffleState);
    const currentTrackId = currentTrackRef.current?.id;

    if (!queue.length) {
      setPlaybackQueue([]);
      return;
    }

    if (nextShuffleState) {
      const nextPlaybackQueue = buildShuffleQueue(queue, currentTrackId);
      setPlaybackQueue(nextPlaybackQueue);
    } else {
      setPlaybackQueue(queue);
    }
  }, [buildShuffleQueue, isShuffleEnabled, queue]);

  const playTrack = useCallback(
    async (track: Track, nextQueue?: Track[], playImmediately = true) => {
      const requestId = ++playTrackRequestRef.current;
      const fallbackArtwork = normalizeArtworkUrl(
        currentTrackRef.current?.id === track.id
          ? currentTrackRef.current.artworkUrl
          : trackArtworkCacheRef.current.get(track.id),
      );
      const resolvedTrack = await resolveTrackArtwork(track, fallbackArtwork);
      const resolvedForCurrentTrack = mergeTrack(
        currentTrackRef.current,
        resolvedTrack,
      );
      artworkRecoveryAttemptRef.current.delete(resolvedForCurrentTrack.id);
      artworkRecoveryRunningRef.current.delete(resolvedForCurrentTrack.id);

      if (requestId !== playTrackRequestRef.current) {
        const currentTrackForRequest = currentTrackRef.current;
        if (
          currentTrackForRequest?.id === resolvedForCurrentTrack.id &&
          currentTrackForRequest.artworkUrl !== resolvedForCurrentTrack.artworkUrl
        ) {
          setCurrentTrack((previousTrack) =>
            previousTrack
              ? mergeTrack(previousTrack, resolvedForCurrentTrack)
              : resolvedForCurrentTrack,
          );
          cacheArtwork(resolvedForCurrentTrack);
        }
        if (currentTrackForRequest?.id === resolvedForCurrentTrack.id && !currentTrackForRequest.artworkUrl) {
          void recoverArtworkForCurrentTrack(resolvedForCurrentTrack.id);
        }

        return;
      }

      const tracksForQueue = nextQueue?.length ? nextQueue : [track];
      const queueInfo = await Promise.all(
        tracksForQueue.map(async (queuedTrack) => {
          if (queuedTrack.id !== track.id) {
            return queuedTrack;
          }

          return mergeTrack(queuedTrack, resolvedTrack);
        }),
      );
      if (requestId !== playTrackRequestRef.current) {
        return;
      }

      const primaryTrackInfo =
        queueInfo.find(
          (queuedTrack) =>
            queuedTrack.id === resolvedForCurrentTrack.id,
        ) ?? resolvedForCurrentTrack;

      cacheArtwork(primaryTrackInfo);

      const shouldAutoPlay = playImmediately && isPlayable(track);

      const nextPlaybackQueue = isShuffleEnabled
        ? buildShuffleQueue(queueInfo, primaryTrackInfo.id)
        : queueInfo;
      setQueue(queueInfo);
      setPlaybackQueue(nextPlaybackQueue);

      const isSameTrack = currentTrackRef.current?.id === primaryTrackInfo.id;

      if (isSameTrack) {
        const syncTrackMeta = (previousTrack: Track | null) =>
          previousTrack
            ? mergeTrack(previousTrack, primaryTrackInfo)
            : primaryTrackInfo;

        if (shouldAutoPlay) {
          if (audio && audio.currentSrc !== primaryTrackInfo.streamUrl) {
            audio.src = primaryTrackInfo.streamUrl ?? "";
            setCurrentTime(0);
            audio.load();
          }
          setCurrentTrack(syncTrackMeta);
          setIsBuffering(false);
          setIsPlaying((playing) => !playing);
          if (!primaryTrackInfo.artworkUrl) {
            void recoverArtworkForCurrentTrack(primaryTrackInfo.id);
          }
          return;
        }

        setCurrentTrack(syncTrackMeta);
        setIsBuffering(false);
        if (!primaryTrackInfo.artworkUrl) {
          void recoverArtworkForCurrentTrack(primaryTrackInfo.id);
        }
        return;
      }
      setTrack(primaryTrackInfo, shouldAutoPlay);
      if (!primaryTrackInfo.artworkUrl) {
        void recoverArtworkForCurrentTrack(primaryTrackInfo.id);
      }

      if (shouldAutoPlay && audio && primaryTrackInfo.streamUrl) {
        if (audio.src !== primaryTrackInfo.streamUrl) {
          audio.src = primaryTrackInfo.streamUrl;
          setCurrentTime(0);
        }
        if (audioContext?.state === "suspended") {
          try {
            await audioContext.resume();
            setPlaybackError(null);
          } catch (error) {
            setPlaybackError(
              classifyPlaybackError(error, "unsupported-audio-context"),
            );
            console.warn("Error resuming audio context:", error);
          }
        }
      }

      cacheTrack({
        ...track,
        artworkUrl: primaryTrackInfo.artworkUrl || track.artworkUrl,
      }).catch((error) => {
        console.warn("Failed to cache track:", error);
      });
      if (shouldAutoPlay) {
        addRecentPlay(track.id).catch((error) => {
          console.warn("Failed to record recent play:", error);
        });
      }
    },
    [
      audio,
      audioContext,
      cacheArtwork,
      buildShuffleQueue,
      isShuffleEnabled,
      mergeTrack,
      recoverArtworkForCurrentTrack,
      setTrack,
      resolveTrackArtwork,
    ]
  );

  useEffect(() => {
    currentTrackRef.current = currentTrack;
    if (currentTrack?.artworkUrl) {
      cacheArtwork(currentTrack);
    }
    if (currentTrack && !currentTrack.artworkUrl) {
      void recoverArtworkForCurrentTrack(currentTrack.id);
    }
  }, [cacheArtwork, currentTrack, recoverArtworkForCurrentTrack]);

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      const selectedInPlaybackQueue = playbackQueue.find(
        (track) => track.id === assetId,
      );
      const selected = selectedInPlaybackQueue ?? queue.find((track) => track.id === assetId);
      if (!selected || selected.id === currentTrack?.id) return;
      setTrack(selected, isPlaying);
    },
    [currentTrack?.id, isPlaying, playbackQueue, queue, setTrack]
  );

  useEffect(() => {
    if (playbackQueue.length > 0) {
      return;
    }

    if (!currentTrack || queue.length === 0) {
      return;
    }

    const currentTrackIndex = queue.findIndex(
      (track) => track.id === currentTrack.id,
    );
    if (currentTrackIndex < 0) {
      return;
    }

    setPlaybackQueue(queue);
  }, [currentTrack?.id, playbackQueue.length, queue]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || activeQueue.length < 2) return;

    const currentTrackId = currentTrackRef.current?.id ?? currentTrack.id;
    const currentIndex = activeQueue.findIndex(
      (track) => track.id === currentTrackId,
    );
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= activeQueue.length) return;
    setTrack(activeQueue[nextIndex], isPlaying);
  }, [
    isPlaying,
    currentTrack,
    activeQueue,
    setTrack,
  ]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || activeQueue.length < 2) return;

    const currentTrackId = currentTrackRef.current?.id ?? currentTrack.id;
    const currentIndex = activeQueue.findIndex(
      (track) => track.id === currentTrackId,
    );
    if (currentIndex < 0) {
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    setTrack(activeQueue[prevIndex], isPlaying);
  }, [
    isPlaying,
    currentTrack,
    activeQueue,
    setTrack,
  ]);

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack || !isPlayable(currentTrack)) return;

    if (audioContext?.state === "suspended") {
      try {
        await audioContext.resume();
        setPlaybackError(null);
      } catch (error) {
        setPlaybackError(
          classifyPlaybackError(error, "unsupported-audio-context"),
        );
        setIsPlaying(false);
        return;
      }
    }

    setIsPlaying((playing) => !playing);
  }, [audioContext, currentTrack]);

  const seek = useCallback(
    (time: number) => {
      if (!audio || !currentTrack) return;

      const nextTime = Math.max(0, Math.min(time, audio.duration || 0));
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [audio, currentTrack]
  );

  useEffect(() => {
    if (!audio) return;
    const trackUrl = currentTrack?.streamUrl;

    if (trackUrl) {
      if (audio.src !== trackUrl) {
        audio.src = trackUrl;
        setCurrentTime(0);
        audio.load();
      }
    } else {
      setIsBuffering(false);
      audio.pause();
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    if (audioContext?.state === "suspended") {
      audioContext
        .resume()
        .catch((error) => {
          setPlaybackError(
            classifyPlaybackError(error, "unsupported-audio-context"),
          );
          console.warn("Error resuming audio context:", error);
        })
        .finally(() => {
          void audio
            .play()
            .then(() => setPlaybackError(null))
            .catch((error) => {
              setPlaybackError(
                classifyPlaybackError(error, "source-load-failed"),
              );
              console.warn("Error playing audio:", error);
              setIsPlaying(false);
            });
        });
      return;
    }

    void audio.play().then(() => setPlaybackError(null)).catch((error) => {
      setPlaybackError(classifyPlaybackError(error, "source-load-failed"));
      console.warn("Error playing audio:", error);
      setIsPlaying(false);
    });
  }, [audio, audioContext, isPlaying, currentTrack]);

  useEffect(() => {
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [audio, isMuted, volume]);

  useEffect(() => {
    if (!audio) return;

    return setupAudioEventListeners({
      state: {
        audio,
        storeSetCurrentTime: setCurrentTime,
        storeSetDuration: setDuration,
        storeSetIsBuffering: setIsBuffering,
      },
      isSeekingRef,
      nextTrack,
    });
  }, [audio, nextTrack]);

  return useMemo(
    () => ({
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      isBuffering,
      volume,
      isMuted,
      isShuffleEnabled,
      audioInstance: audio,
      audioContext,
      audioAnalyser,
      audioCapabilities,
      cleanAudioInstance,
      playbackError,
      setTrack,
      playTrack,
      handleSelectTrack,
      togglePlayPause,
      toggleShuffle,
      setIsPlaying,
      setCurrentTime,
      setDuration,
      setIsBuffering,
      setVolume,
      toggleMute,
      seekTo: seek,
      seek,
      nextTrack,
      prevTrack,
      setLiveVolume,
    }),
    [
      audio,
      audioAnalyser,
      audioCapabilities,
      audioContext,
      cleanAudioInstance,
      currentTime,
      currentTrack,
      duration,
      handleSelectTrack,
      isBuffering,
      isMuted,
      isPlaying,
      isShuffleEnabled,
      nextTrack,
      playbackError,
      playTrack,
      prevTrack,
      seek,
      setLiveVolume,
      setTrack,
      setVolume,
      toggleMute,
      togglePlayPause,
      toggleShuffle,
      volume,
    ]
  );
}

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const audioPlayerData = useAudioPlayerLogic();
  return (
    <AudioPlayerContext.Provider value={audioPlayerData}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerLogicReturnType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within a AudioPlayerProvider");
  }
  return context;
};
