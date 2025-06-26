import { useCallback, useEffect } from "react";
import { isNumber } from "lodash";
import { useAudioState } from "./useAudioState";

export const useAudioVolume = () => {
  const { audio, volume, isMuted, storeSetVolume, storeToggleMute } =
    useAudioState();

  const setLiveVolume = useCallback(
    (newVolume: number) => {
      if (isNumber(newVolume) && audio) {
        audio.volume = newVolume;
      }
    },
    [audio]
  );

  // 볼륨/음소거 상태가 변경되면 오디오 볼륨을 업데이트
  useEffect(() => {
    if (isNumber(volume)) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audio]);

  return {
    setVolume: storeSetVolume,
    toggleMute: storeToggleMute,
    setLiveVolume,
  };
};
