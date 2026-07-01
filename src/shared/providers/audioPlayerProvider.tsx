"use client";

import type { Track } from "@/entities/track";
import { isPlayable } from "@/entities/track";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { cacheTrack } from "@/shared/db";
import { addRecentPlay } from "@/shared/db";
import { CLAMP_VOLUME } from "@/shared/lib/util";
import { logger } from "@/shared/lib/logger";
import { normalizeArtworkUrl } from "@/shared/lib/trackArtwork";
import { classifyPlaybackError } from "./audioPlaybackErrors";
import { useMediaSession } from "../hooks/useMediaSession";
import { useAudioPlaybackLifecycle } from "../hooks/useAudioPlaybackLifecycle";
import { setMasterAudioVolume } from "@/shared/lib/audioInstance";
import type {
  AudioPlayerLogicReturnType,
  PlaybackError,
} from "./audioPlayerTypes";
import { useAudioArtworkRecovery } from "./useAudioArtworkRecovery";
import { useAudioElementSync } from "./useAudioElementSync";
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

const DEFAULT_TRACK_CROSSFADE_DURATION_SEC = 3;

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
  const refreshAudioInstance = useAudioInstanceStore(
    (state) => state.refreshAudioInstance
  );
  const currentTrackRef = useRef<Track | null>(null);
  const playTrackRequestRef = useRef(0);

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

  const {
    cacheArtwork,
    clearArtworkRecovery,
    getRememberedArtwork,
    recoverArtworkForCurrentTrack,
    resolveTrackArtwork,
  } = useAudioArtworkRecovery({
    currentTrackRef,
    setCurrentTrack,
    setQueue,
  });

  const setLiveVolume = useCallback(
    (nextVolume: number) => {
      setMasterAudioVolume(CLAMP_VOLUME(nextVolume));
    },
    []
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
          : getRememberedArtwork(track.id),
      );
      const resolvedTrack = await resolveTrackArtwork(track, fallbackArtwork);
      const resolvedForCurrentTrack = mergeTrack(
        currentTrackRef.current,
        resolvedTrack,
      );
      clearArtworkRecovery(resolvedForCurrentTrack.id);

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

      if (shouldAutoPlay && audio) {
        if (audioContext?.state === "suspended") {
          try {
            await audioContext.resume();
            setPlaybackError(null);
          } catch (error) {
            setPlaybackError(
              classifyPlaybackError(error, "unsupported-audio-context"),
            );
            logger.warn("Error resuming audio context:", error);
          }
        }
      }

      cacheTrack({
        ...track,
        artworkUrl: primaryTrackInfo.artworkUrl || track.artworkUrl,
      }).catch((error) => {
        logger.warn("Failed to cache track:", error);
      });
      if (shouldAutoPlay) {
        addRecentPlay(track.id).catch((error) => {
          logger.warn("Failed to record recent play:", error);
        });
      }
    },
    [
      audio,
      audioContext,
      cacheArtwork,
      buildShuffleQueue,
      clearArtworkRecovery,
      getRememberedArtwork,
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

  useAudioElementSync({
    audio,
    audioContext,
    currentTrack,
    crossfadeDurationSec: DEFAULT_TRACK_CROSSFADE_DURATION_SEC,
    refreshAudioInstance,
    isPlaying,
    isMuted,
    volume,
    isSeekingRef,
    nextTrack,
    setCurrentTime,
    setDuration,
    setIsBuffering,
    setIsPlaying,
    setPlaybackError,
  });

  useMediaSession({
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo: seek,
  });

  useAudioPlaybackLifecycle({
    isPlaying,
    audioContext,
    audio,
    restoreStrategy:
      process.env.NEXT_PUBLIC_AUDIO_BACKGROUND_RESTORE_STRATEGY ===
      "media-element-first"
        ? "media-element-first"
        : "context-first",
  });

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
