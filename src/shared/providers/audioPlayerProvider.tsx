"use client";

import type { Track } from "@/entities/Track/model";
import { isPlayable } from "@/entities/Track/model";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
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

const toTrackInfoWithCache = async (track: Track): Promise<TrackInfo> => {
  const artworkId = await resolveArtworkUrlWithCache(track);
  return toTrackInfo(track, artworkId);
};

function useAudioPlayerLogic(): AudioPlayerLogicReturnType {
  const audio = useAudioInstanceStore((state) => state.audioInstance);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const audioAnalyser = useAudioInstanceStore((state) => state.audioAnalyser);
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );

  const isSeekingRef = useRef(false);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(CLAMP_VOLUME(nextVolume));
    setIsMuted(nextVolume === 0);
  }, []);

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

  const setTrack = useCallback((track: TrackInfo, playImmediately = false) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsBuffering(playImmediately && Boolean(track.url));
    setIsPlaying(playImmediately && Boolean(track.url));
  }, []);

  const playTrack = useCallback(
    async (track: Track, nextQueue?: Track[], playImmediately = true) => {
      const resolvedTrackInfo = await toTrackInfoWithCache(track);
      const tracksForQueue = nextQueue?.length ? nextQueue : [track];
      const queueInfo = await Promise.all(
        tracksForQueue.map(async (queuedTrack) =>
          queuedTrack.id === track.id
            ? resolvedTrackInfo
            : toTrackInfo(queuedTrack),
        ),
      );
      const shouldAutoPlay = playImmediately && isPlayable(track);

      setQueue(queueInfo);
      setTrack(resolvedTrackInfo, shouldAutoPlay);

      if (shouldAutoPlay && audio && resolvedTrackInfo.url) {
        if (audio.src !== resolvedTrackInfo.url) {
          audio.src = resolvedTrackInfo.url;
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

      cacheTrack(track).catch((error) => {
        console.warn("Failed to cache track:", error);
      });
      if (shouldAutoPlay) {
        addRecentPlay(track.id).catch((error) => {
          console.warn("Failed to record recent play:", error);
        });
      }
    },
    [audio, audioContext, setTrack]
  );

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      const selected = queue.find((track) => track.assetId === assetId);
      if (!selected || selected.assetId === currentTrack?.assetId) return;
      setTrack(selected, isPlaying);
    },
    [currentTrack?.assetId, isPlaying, queue, setTrack]
  );

  const nextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(
      (track) => track.assetId === currentTrack.assetId
    );
    const nextIndex = (currentIndex + 1) % queue.length;
    setTrack(queue[nextIndex], isPlaying);
  }, [currentTrack, isPlaying, queue, setTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(
      (track) => track.assetId === currentTrack.assetId
    );
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setTrack(queue[prevIndex], isPlaying);
  }, [currentTrack, isPlaying, queue, setTrack]);

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
      }
      audio.load();
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
      audioInstance: audio,
      audioContext,
      audioAnalyser,
      cleanAudioInstance,
      setTrack,
      playTrack,
      handleSelectTrack,
      togglePlayPause,
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
      nextTrack,
      playTrack,
      prevTrack,
      seek,
      setLiveVolume,
      setTrack,
      setVolume,
      toggleMute,
      togglePlayPause,
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
