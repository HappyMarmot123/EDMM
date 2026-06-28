"use client";

import type { Track } from "@/entities/Track/model";
import { isPlayable } from "@/entities/Track/model";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { cacheTrack, getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { addRecentPlay } from "@/shared/db/repositories/recentPlaysRepo";
import { CLAMP_VOLUME } from "@/shared/lib/util";
import { normalizeArtworkUrl, resolveArtworkUrlWithCache } from "@/shared/lib/trackArtwork";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import {
  AudioPlayerLogicReturnType,
  TrackInfo,
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

const toTrackInfo = (track: Track, artworkId?: string): TrackInfo => ({
  assetId: track.id,
  album: track.albumName ?? track.source,
  name: track.title,
  artworkId: normalizeArtworkUrl(artworkId ?? track.artworkUrl),
  url: isPlayable(track) ? track.streamUrl ?? "" : "",
  producer: track.artistName,
});

function useAudioPlayerLogic(): AudioPlayerLogicReturnType {
  const audio = useAudioInstanceStore((state) => state.audioInstance);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const audioAnalyser = useAudioInstanceStore((state) => state.audioAnalyser);
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );
  const currentTrackRef = useRef<TrackInfo | null>(null);
  const trackArtworkCacheRef = useRef(new Map<string, string>());
  const playTrackRequestRef = useRef(0);
  const artworkRecoveryAttemptRef = useRef(new Map<string, number>());
  const artworkRecoveryRunningRef = useRef(new Set<string>());

  const isSeekingRef = useRef(false);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [playbackQueue, setPlaybackQueue] = useState<TrackInfo[]>([]);
  const activeQueue = useMemo(
    () => (playbackQueue.length > 0 ? playbackQueue : queue),
    [playbackQueue, queue],
  );

  const buildShuffleQueue = useCallback((nextQueue: TrackInfo[], currentTrackId?: string) => {
    if (nextQueue.length <= 1) {
      return nextQueue;
    }

    const queueCopy = [...nextQueue];
    let currentTrackItem: TrackInfo | undefined;

    if (currentTrackId) {
      const index = queueCopy.findIndex((track) => track.assetId === currentTrackId);
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

  const mergeTrackInfo = useCallback(
    (existing: TrackInfo | null, next: TrackInfo): TrackInfo => {
      if (!existing || existing.assetId !== next.assetId) {
        return next;
      }

      return {
        ...existing,
        album: next.album || existing.album,
        name: next.name || existing.name,
        producer: next.producer || existing.producer,
        url: next.url || existing.url,
        artworkId: next.artworkId || existing.artworkId,
      };
    },
    [],
  );

  const cacheArtwork = useCallback((trackInfo: TrackInfo) => {
    if (trackInfo.artworkId) {
      trackArtworkCacheRef.current.set(trackInfo.assetId, trackInfo.artworkId);
    }
  }, []);

  const toTrackInfoWithCache = useCallback(
    async (track: Track, fallbackArtworkId = ""): Promise<TrackInfo> => {
      const directArtwork = normalizeArtworkUrl(track.artworkUrl);
      if (directArtwork) {
        cacheArtwork({
          ...toTrackInfo(track),
          artworkId: directArtwork,
        });
        return toTrackInfo(track, directArtwork);
      }

      const normalizedFallback = normalizeArtworkUrl(fallbackArtworkId);
      if (normalizedFallback) {
        return toTrackInfo(track, normalizedFallback);
      }

      const rememberedArtwork = normalizeArtworkUrl(
        trackArtworkCacheRef.current.get(track.id),
      );
      if (rememberedArtwork) {
        return toTrackInfo(track, rememberedArtwork);
      }

      const resolvedArtwork = normalizeArtworkUrl(
        await resolveArtworkUrlWithCache(track),
      );
      if (resolvedArtwork) {
        cacheArtwork({
          ...toTrackInfo(track),
          artworkId: resolvedArtwork,
        });
      }

      return toTrackInfo(track, resolvedArtwork);
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
        if (currentTrackRef.current?.assetId !== normalizedId) {
          break;
        }

        const cachedTrack = await getCachedTrack(normalizedId).catch(() => undefined);
        const resolvedArtwork = normalizeArtworkUrl(cachedTrack?.artworkUrl);

        if (resolvedArtwork) {
          setCurrentTrack((previousTrack) => {
            if (!previousTrack || previousTrack.assetId !== normalizedId) {
              return previousTrack;
            }

            if (previousTrack.artworkId) {
              return previousTrack;
            }

            const patchedTrack = { ...previousTrack, artworkId: resolvedArtwork };
            cacheArtwork(patchedTrack);
            return patchedTrack;
          });

          setQueue((previousQueue) => {
            if (previousQueue.every((item) => item.assetId !== normalizedId)) {
              return previousQueue;
            }

            return previousQueue.map((item) =>
              item.assetId === normalizedId ? { ...item, artworkId: resolvedArtwork } : item,
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
    (track: TrackInfo, playImmediately = false) => {
      const mergedTrack = mergeTrackInfo(currentTrackRef.current, track);

      cacheArtwork(mergedTrack);
      setCurrentTrack(mergedTrack);
      setCurrentTime(0);
      setIsBuffering(playImmediately && Boolean(mergedTrack.url));
      setIsPlaying(playImmediately && Boolean(mergedTrack.url));
    },
    [cacheArtwork, mergeTrackInfo],
  );

  const toggleShuffle = useCallback(() => {
    const nextShuffleState = !isShuffleEnabled;
    setIsShuffleEnabled(nextShuffleState);
    const currentTrackId = currentTrackRef.current?.assetId;

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
        currentTrackRef.current?.assetId === track.id
          ? currentTrackRef.current.artworkId
          : trackArtworkCacheRef.current.get(track.id),
      );
      const resolvedTrackInfo = await toTrackInfoWithCache(track, fallbackArtwork);
      const resolvedForCurrentTrack = mergeTrackInfo(
        currentTrackRef.current,
        resolvedTrackInfo,
      );
      artworkRecoveryAttemptRef.current.delete(resolvedForCurrentTrack.assetId);
      artworkRecoveryRunningRef.current.delete(resolvedForCurrentTrack.assetId);

      if (requestId !== playTrackRequestRef.current) {
        const currentTrackForRequest = currentTrackRef.current;
        if (
          currentTrackForRequest?.assetId === resolvedForCurrentTrack.assetId &&
          currentTrackForRequest.artworkId !== resolvedForCurrentTrack.artworkId
        ) {
          setCurrentTrack((previousTrack) =>
            previousTrack
              ? mergeTrackInfo(previousTrack, resolvedForCurrentTrack)
              : resolvedForCurrentTrack,
          );
          cacheArtwork(resolvedForCurrentTrack);
        }
        if (currentTrackForRequest?.assetId === resolvedForCurrentTrack.assetId && !currentTrackForRequest.artworkId) {
          void recoverArtworkForCurrentTrack(resolvedForCurrentTrack.assetId);
        }

        return;
      }

      const tracksForQueue = nextQueue?.length ? nextQueue : [track];
      const queueInfo = await Promise.all(
        tracksForQueue.map(async (queuedTrack) => {
          const queuedTrackInfo = toTrackInfo(queuedTrack);
          if (queuedTrack.id !== track.id) {
            return queuedTrackInfo;
          }

          return mergeTrackInfo(queuedTrackInfo, resolvedTrackInfo);
        }),
      );
      if (requestId !== playTrackRequestRef.current) {
        return;
      }

      const primaryTrackInfo =
        queueInfo.find(
          (queuedTrack) =>
            queuedTrack.assetId === resolvedForCurrentTrack.assetId,
        ) ?? resolvedForCurrentTrack;

      cacheArtwork(primaryTrackInfo);

      const shouldAutoPlay = playImmediately && isPlayable(track);

      const nextPlaybackQueue = isShuffleEnabled
        ? buildShuffleQueue(queueInfo, primaryTrackInfo.assetId)
        : queueInfo;
      setQueue(queueInfo);
      setPlaybackQueue(nextPlaybackQueue);

      const isSameTrack = currentTrackRef.current?.assetId === primaryTrackInfo.assetId;

      if (isSameTrack) {
        const syncTrackMeta = (previousTrack: TrackInfo | null) =>
          previousTrack
            ? mergeTrackInfo(previousTrack, primaryTrackInfo)
            : primaryTrackInfo;

        if (shouldAutoPlay) {
          if (audio && audio.currentSrc !== primaryTrackInfo.url) {
            audio.src = primaryTrackInfo.url;
            setCurrentTime(0);
            audio.load();
          }
          setCurrentTrack(syncTrackMeta);
          setIsBuffering(false);
          setIsPlaying((playing) => !playing);
          if (!primaryTrackInfo.artworkId) {
            void recoverArtworkForCurrentTrack(primaryTrackInfo.assetId);
          }
          return;
        }

        setCurrentTrack(syncTrackMeta);
        setIsBuffering(false);
        if (!primaryTrackInfo.artworkId) {
          void recoverArtworkForCurrentTrack(primaryTrackInfo.assetId);
        }
        return;
      }
      setTrack(primaryTrackInfo, shouldAutoPlay);
      if (!primaryTrackInfo.artworkId) {
        void recoverArtworkForCurrentTrack(primaryTrackInfo.assetId);
      }

      if (shouldAutoPlay && audio && primaryTrackInfo.url) {
        if (audio.src !== primaryTrackInfo.url) {
          audio.src = primaryTrackInfo.url;
          setCurrentTime(0);
        }
        if (audioContext?.state === "suspended") {
          try {
            await audioContext.resume();
          } catch (error) {
            console.warn("Error resuming audio context:", error);
          }
        }
      }

      cacheTrack({
        ...track,
        artworkUrl: primaryTrackInfo.artworkId || track.artworkUrl,
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
      mergeTrackInfo,
      recoverArtworkForCurrentTrack,
      setTrack,
      toTrackInfoWithCache,
    ]
  );

  useEffect(() => {
    currentTrackRef.current = currentTrack;
    if (currentTrack?.artworkId) {
      cacheArtwork(currentTrack);
    }
    if (currentTrack && !currentTrack.artworkId) {
      void recoverArtworkForCurrentTrack(currentTrack.assetId);
    }
  }, [cacheArtwork, currentTrack, recoverArtworkForCurrentTrack]);

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      const selectedInPlaybackQueue = playbackQueue.find(
        (track) => track.assetId === assetId,
      );
      const selected = selectedInPlaybackQueue ?? queue.find((track) => track.assetId === assetId);
      if (!selected || selected.assetId === currentTrack?.assetId) return;
      setTrack(selected, isPlaying);
    },
    [currentTrack?.assetId, isPlaying, playbackQueue, queue, setTrack]
  );

  useEffect(() => {
    if (playbackQueue.length > 0) {
      return;
    }

    if (!currentTrack || queue.length === 0) {
      return;
    }

    const currentTrackIndex = queue.findIndex(
      (track) => track.assetId === currentTrack.assetId,
    );
    if (currentTrackIndex < 0) {
      return;
    }

    setPlaybackQueue(queue);
  }, [currentTrack?.assetId, playbackQueue.length, queue]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || activeQueue.length < 2) return;

    const currentTrackId = currentTrackRef.current?.assetId ?? currentTrack.assetId;
    const currentIndex = activeQueue.findIndex(
      (track) => track.assetId === currentTrackId,
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

    const currentTrackId = currentTrackRef.current?.assetId ?? currentTrack.assetId;
    const currentIndex = activeQueue.findIndex(
      (track) => track.assetId === currentTrackId,
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
    if (!currentTrack?.url) return;

    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }

    setIsPlaying((playing) => !playing);
  }, [audioContext, currentTrack?.url]);

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
    const trackUrl = currentTrack?.url;

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
          console.warn("Error resuming audio context:", error);
        })
        .finally(() => {
          void audio
            .play()
            .catch((error) => {
              console.warn("Error playing audio:", error);
              setIsPlaying(false);
            });
        });
      return;
    }

    void audio.play().catch((error) => {
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
      cleanAudioInstance,
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
