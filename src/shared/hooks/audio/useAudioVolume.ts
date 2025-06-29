import { useCallback } from "react";
import { isNumber } from "lodash";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

export const useAudioVolume = () => {
  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const storeSetVolume = useTrackStore((state) => state.setVolume);
  const storeToggleMute = useTrackStore((state) => state.toggleMute);

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
