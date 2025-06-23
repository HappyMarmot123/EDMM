import { useCallback } from "react";
import { isNumber } from "lodash";
import { useAudioState } from "./useAudioState";

export const useAudioVolume = () => {
  const { audio, storeSetVolume, storeToggleMute } = useAudioState();

  const setLiveVolume = useCallback(
    (newVolume: number) => {
      if (isNumber(newVolume) && audio) {
        audio.volume = newVolume;
      }
    },
    [audio]
  );

  return {
    setVolume: storeSetVolume,
    toggleMute: storeToggleMute,
    setLiveVolume,
  };
};
