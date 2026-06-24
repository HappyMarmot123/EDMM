"use client";

import type { Track } from "@/entities/track/model";
import { isPlayable } from "@/entities/track/model";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { addRecentPlay } from "@/shared/db/repositories/recentPlaysRepo";
import { CLAMP_VOLUME } from "@/shared/lib/util";
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

const toTrackInfo = (track: Track): TrackInfo => ({
  assetId: track.id,
  album: track.albumName ?? track.source,
  name: track.title,
  artworkId: track.artworkUrl,
  url: track.streamUrl ?? "",
  producer: track.artistName,
});

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
    setIsBuffering(Boolean(track.url));
    setIsPlaying(playImmediately && Boolean(track.url));
  }, []);

  const playTrack = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      const trackInfo = toTrackInfo(track);
      const queueInfo = (nextQueue?.length ? nextQueue : [track]).map(
        toTrackInfo
      );

      setQueue(queueInfo);
      setTrack(trackInfo, isPlayable(track));

      cacheTrack(track).catch((error) => {
        console.warn("Failed to cache track:", error);
      });
      addRecentPlay(track.id).catch((error) => {
        console.warn("Failed to record recent play:", error);
      });
    },
    [setTrack]
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
    if (!audio || !currentTrack?.url) return;

    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      setCurrentTime(0);
    }
  }, [audio, currentTrack]);

  useEffect(() => {
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.warn("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [audio, isPlaying, currentTrack]);

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

  useEffect(() => {
    return () => {
      cleanAudioInstance();
    };
  }, [cleanAudioInstance]);

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
