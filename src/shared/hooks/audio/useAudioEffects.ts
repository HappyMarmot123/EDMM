import { useEffect, useMemo } from "react";
import { isNumber } from "lodash";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import { useAudioSeeking } from "./useAudioSeeking";
import { useAudioPlayControl } from "./useAudioPlayControl";

export const useAudioEffects = () => {
  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );

  const { isSeekingRef } = useAudioSeeking();
  const { nextTrack } = useAudioPlayControl();

  const currentTrack = useTrackStore((state) => state.currentTrack);
  const isPlaying = useTrackStore((state) => state.isPlaying);
  const volume = useTrackStore((state) => state.volume);
  const isMuted = useTrackStore((state) => state.isMuted);
  const storeSetCurrentTime = useTrackStore((state) => state.setCurrentTime);
  const storeSetDuration = useTrackStore((state) => state.setDuration);
  const storeSetIsBuffering = useTrackStore((state) => state.setIsBuffering);

  // 오디오 트랙 변경시시 초기화
  useEffect(() => {
    const isTrackChanged = currentTrack?.url && audio.src !== currentTrack.url;
    if (isTrackChanged) {
      audio.src = currentTrack.url;
      storeSetCurrentTime(0);
    }
  }, [currentTrack, audio, storeSetCurrentTime]);

  // 재생/일시정지
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch((e) => console.warn("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, audio]);

  // 볼륨/음소거
  useEffect(() => {
    if (isNumber(volume)) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audio]);

  const actions = useMemo(
    () => ({
      state: {
        audio,
        storeSetCurrentTime,
        storeSetDuration,
        storeSetIsBuffering,
      },
      isSeekingRef,
      nextTrack,
    }),
    [
      audio,
      storeSetCurrentTime,
      storeSetDuration,
      storeSetIsBuffering,
      isSeekingRef,
      nextTrack,
    ]
  );

  useEffect(() => {
    const cleanup = setupAudioEventListeners(actions);
    return cleanup;
  }, [actions]);

  // 언마운트 이벤트 클린업업
  useEffect(() => {
    return () => {
      if (cleanAudioInstance) {
        cleanAudioInstance();
      }
    };
  }, [cleanAudioInstance]);
};
