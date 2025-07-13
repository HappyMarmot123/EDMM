// actions.audio, actions.isSeekingRef를 제외한 모든 프롭은 actions.state.로 접근하도록 수정

export const setupAudioEventListeners = (actions: any) => {
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

  const handleError = (e: Event) => {
    console.error("Audio Error:", e);
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
