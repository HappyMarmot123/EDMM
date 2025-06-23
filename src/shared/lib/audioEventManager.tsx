import type { AudioStoreActions } from "@/shared/types/dataType";

export const setupAudioEventListeners = (
  audio: HTMLAudioElement,
  actions: AudioStoreActions,
  isSeekingRef: React.MutableRefObject<boolean>,
  nextTrack: () => void
) => {
  const handleTimeUpdate = () => {
    if (!isSeekingRef.current) {
      actions.storeSetCurrentTime(audio.currentTime || 0);
    }
  };

  const handleDurationChange = () => {
    if (!isNaN(audio.duration) && isFinite(audio.duration)) {
      actions.storeSetDuration(audio.duration);
      actions.storeSetIsBuffering(false);
    } else {
      actions.storeSetDuration(0);
    }
  };

  const handleError = (e: Event) => {
    console.error("Audio Error:", e);
    actions.storeSetIsBuffering(false);
  };

  const handleWaiting = () => {
    if (!isSeekingRef.current) {
      actions.storeSetIsBuffering(true);
    }
  };

  const handlePlaying = () => {
    actions.storeSetIsBuffering(false);
  };

  //   const handleCanPlayThrough = () => {
  //     if (isSeekingRef.current) {
  //       isSeekingRef.current = false;
  //     }
  //     actions.storeSetIsBuffering(false);
  //   };

  const handleSeeked = () => {
    isSeekingRef.current = false;
  };

  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("durationchange", handleDurationChange);
  audio.addEventListener("loadedmetadata", handleDurationChange);
  audio.addEventListener("ended", nextTrack);
  audio.addEventListener("error", handleError);
  audio.addEventListener("waiting", handleWaiting);
  audio.addEventListener("playing", handlePlaying);
  audio.addEventListener("seeked", handleSeeked);

  return () => {
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("durationchange", handleDurationChange);
    audio.removeEventListener("loadedmetadata", handleDurationChange);
    audio.removeEventListener("ended", nextTrack);
    audio.removeEventListener("error", handleError);
    audio.removeEventListener("waiting", handleWaiting);
    audio.removeEventListener("playing", handlePlaying);
    audio.removeEventListener("seeked", handleSeeked);
  };
};
