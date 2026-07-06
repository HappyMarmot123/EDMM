"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Track } from "@/entities/track";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import { logger } from "@/shared/lib/logger";
import { setMasterAudioVolume, transitionAudioTrack } from "@/shared/lib/audioInstance";
import {
  capturePlaybackErrorEvent,
  getCurrentBrowserRoute,
} from "@/shared/lib/sentry/playbackEvents";
import type { PlaybackError } from "./audioPlayerTypes";
import {
  classifyPlaybackError,
  isPlaybackErrorRetryable,
  PLAYBACK_ERROR_CODES,
} from "./audioPlaybackErrors";

type SeekingRef = {
  current: boolean;
};

type UseAudioElementSyncParams = {
  audio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  refreshAudioInstance?: () => void;
  volume: number;
  crossfadeDurationSec?: number;
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
  crossfadeDurationSec = 0,
  isSeekingRef,
  nextTrack,
  refreshAudioInstance,
  setCurrentTime,
  setDuration,
  setIsBuffering,
  setIsPlaying,
  setPlaybackError,
}: UseAudioElementSyncParams) {
  useEffect(() => {
    if (!audio) return;
    const trackUrl = currentTrack?.streamUrl;

    if (!trackUrl) {
      setIsBuffering(false);
      setPlaybackError(null);
      void transitionAudioTrack("", false).catch(() => {});
      return;
    }

    if (!isPlaying && audio.src !== trackUrl) {
      setIsBuffering(false);
      setPlaybackError(null);
      return;
    }

    if (audio.src !== trackUrl) {
      setCurrentTime(0);
    }

    void transitionAudioTrack(trackUrl, isPlaying, crossfadeDurationSec)
      .then(() => {
        refreshAudioInstance?.();
        if (isPlaying) {
          setPlaybackError(null);
        }
      })
      .catch((error) => {
        const errorCode = classifyPlaybackError(
          error,
          PLAYBACK_ERROR_CODES.sourceLoadFailed,
        );
        setPlaybackError(errorCode);
        capturePlaybackErrorEvent({
          errorCode,
          retryable: isPlaybackErrorRetryable(errorCode),
          route: getCurrentBrowserRoute(),
          track: currentTrack,
        });
        logger.warn("Error playing audio:", error);
        setIsPlaying(false);
      });
  }, [
    audio,
    audioContext,
    currentTrack?.id,
    currentTrack?.source,
    currentTrack?.streamUrl,
    crossfadeDurationSec,
    isPlaying,
    setIsBuffering,
    setIsPlaying,
    setPlaybackError,
  ]);

  useEffect(() => {
    const masterVolume = isMuted ? 0 : volume;
    setMasterAudioVolume(masterVolume);
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
