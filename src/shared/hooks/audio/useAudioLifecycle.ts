import { useEffect } from "react";
import { isNumber } from "lodash";
import { useAudioState } from "./useAudioState";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import { usePlaybackControl } from "./usePlaybackControl";

interface AudioLifecycleProps {
  isSeekingRef: React.MutableRefObject<boolean>;
}

export const useAudioLifecycle = ({ isSeekingRef }: AudioLifecycleProps) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    audio,
    storeSetCurrentTime,
    cleanAudioInstance,
    storeSetDuration,
    storeSetIsBuffering,
    setTrack,
  } = useAudioState();

  const { nextTrack } = usePlaybackControl();

  // 현재 트랙이 변경되면 오디오 소스를 업데이트
  useEffect(() => {
    const isTrackChanged = currentTrack && audio.src !== currentTrack.url;
    if (isTrackChanged && currentTrack.url) {
      audio.src = currentTrack.url;
      storeSetCurrentTime(0);
    }
  }, [currentTrack, audio, storeSetCurrentTime]);

  // 볼륨/음소거 상태가 변경되면 오디오 볼륨을 업데이트
  useEffect(() => {
    if (isNumber(volume)) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audio]);

  // 재생 상태가 변경되면 오디오를 재생/일시정지
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch((e) => console.warn("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, audio]);

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const actions = {
      storeSetCurrentTime,
      storeSetDuration,
      storeSetIsBuffering,
      setTrack,
    };
    const cleanup = setupAudioEventListeners(
      audio,
      actions,
      isSeekingRef,
      nextTrack
    );
    return cleanup;
    // nextTrack 꼭 추가하세요 클로저 이슈 생깁니다
  }, [audio, isSeekingRef, nextTrack]);

  // 컴포넌트 언마운트 시 오디오 인스턴스 정리
  useEffect(() => {
    return () => {
      if (cleanAudioInstance) {
        cleanAudioInstance();
      }
    };
  }, [cleanAudioInstance]);
};
