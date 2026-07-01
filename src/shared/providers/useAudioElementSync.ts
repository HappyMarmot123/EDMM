"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Track } from "@/entities/track";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import { logger } from "@/shared/lib/logger";
import type { PlaybackError } from "./audioPlayerTypes";
import { classifyPlaybackError } from "./audioPlaybackErrors";

type SeekingRef = {
  current: boolean;
};

type UseAudioElementSyncParams = {
  audio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isSeekingRef: SeekingRef;
  nextTrack: () => void;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setDuration: Dispatch<SetStateAction<number>>;
  setIsBuffering: Dispatch<SetStateAction<boolean>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setPlaybackError: Dispatch<SetStateAction<PlaybackError>>;
};

export function useAudioElementSync({
  audio,
  audioContext,
  currentTrack,
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
}: UseAudioElementSyncParams) {
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
          logger.warn("Error resuming audio context:", error);
        })
        .finally(() => {
          void audio
            .play()
            .then(() => setPlaybackError(null))
            .catch((error) => {
              setPlaybackError(
                classifyPlaybackError(error, "source-load-failed"),
              );
              logger.warn("Error playing audio:", error);
              setIsPlaying(false);
            });
        });
      return;
    }

    void audio
      .play()
      .then(() => setPlaybackError(null))
      .catch((error) => {
        setPlaybackError(classifyPlaybackError(error, "source-load-failed"));
        logger.warn("Error playing audio:", error);
        setIsPlaying(false);
      });
  }, [
    audio,
    audioContext,
    currentTrack,
    isPlaying,
    setCurrentTime,
    setIsBuffering,
    setIsPlaying,
    setPlaybackError,
  ]);

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
  }, [
    audio,
    isSeekingRef,
    nextTrack,
    setCurrentTime,
    setDuration,
    setIsBuffering,
  ]);
}
