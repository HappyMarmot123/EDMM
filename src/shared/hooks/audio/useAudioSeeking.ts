import { useCallback, useRef } from "react";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

export const useAudioSeeking = () => {
  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const storeSeekTo = useTrackStore((state) => state.seekTo);
  const isSeekingRef = useRef(false);

  const seek = useCallback(
    (time: number) => {
      const duration = audio?.duration || 0;
      if (!audio || !currentTrack) {
        console.error("Audio or currentTrack is null");
        return;
      }

      const newTime = Math.max(0, Math.min(time, duration));
      audio.currentTime = newTime;
      storeSeekTo(newTime);
    },
    [audio, currentTrack, storeSeekTo]
  );

  return { seek, isSeekingRef };
};
