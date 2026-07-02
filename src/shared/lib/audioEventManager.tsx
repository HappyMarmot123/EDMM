import { logger } from "@/shared/lib/logger";

type AudioEventManagerState = {
  audio: HTMLAudioElement;
  storeSetCurrentTime: (time: number) => void;
  storeSetDuration: (duration: number) => void;
  storeSetIsBuffering: (isBuffering: boolean) => void;
};

type AudioEventManagerActions = {
  state: AudioEventManagerState;
  isSeekingRef: { current: boolean };
  nextTrack: () => void;
};

export const setupAudioEventListeners = (actions: AudioEventManagerActions) => {
  const audio = actions.state.audio;

  const handleTimeUpdate = () => {
    if (!actions.isSeekingRef.current) {
      actions.state.storeSetCurrentTime(audio.currentTime || 0);
    }
  };

  const handleDurationChange = () => {
    if (!isNaN(audio.duration) && isFinite(audio.duration)) {
      actions.state.storeSetDuration(audio.duration);
      actions.state.storeSetIsBuffering(false);
    } else {
      actions.state.storeSetDuration(0);
    }
  };

  const handleError = (event: Event) => {
    if (!audio.currentSrc) {
      actions.state.storeSetIsBuffering(false);
      return;
    }

    logger.error("Audio Error:", event);
    actions.state.storeSetIsBuffering(false);
  };

  const handleWaiting = () => {
    if (!actions.isSeekingRef.current) {
      actions.state.storeSetIsBuffering(true);
    }
  };

  const handlePlaying = () => {
    actions.state.storeSetIsBuffering(false);
  };

  const handleSeeking = () => {
    actions.isSeekingRef.current = true;
  };

  const handleSeeked = () => {
    actions.isSeekingRef.current = false;
  };

  if (!isNaN(audio.duration) && isFinite(audio.duration)) {
    handleDurationChange();
  }

  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("durationchange", handleDurationChange);
  audio.addEventListener("loadedmetadata", handleDurationChange);
  audio.addEventListener("ended", actions.nextTrack);
  audio.addEventListener("error", handleError);
  audio.addEventListener("waiting", handleWaiting);
  audio.addEventListener("playing", handlePlaying);
  audio.addEventListener("seeking", handleSeeking);
  audio.addEventListener("seeked", handleSeeked);

  return () => {
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("durationchange", handleDurationChange);
    audio.removeEventListener("loadedmetadata", handleDurationChange);
    audio.removeEventListener("ended", actions.nextTrack);
    audio.removeEventListener("error", handleError);
    audio.removeEventListener("waiting", handleWaiting);
    audio.removeEventListener("playing", handlePlaying);
    audio.removeEventListener("seeking", handleSeeking);
    audio.removeEventListener("seeked", handleSeeked);
  };
};
