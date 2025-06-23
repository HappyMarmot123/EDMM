import { useCallback, useRef } from "react";
import { useAudioState } from "./useAudioState";

export const useAudioSeeking = () => {
  const { audio, currentTrack, storeSeekTo } = useAudioState();
  const isSeekingRef = useRef(false);

  const seek = useCallback(
    (time: number) => {
      const duration = audio?.duration || 0;
      if (!audio || !currentTrack) {
        console.error("Audio or currentTrack is null");
        return;
      }

      isSeekingRef.current = true;
      const newTime = Math.max(0, Math.min(time, duration));
      audio.currentTime = newTime;
      storeSeekTo(newTime);
    },
    [audio, currentTrack, storeSeekTo]
  );

  return { seek, isSeekingRef };
};
