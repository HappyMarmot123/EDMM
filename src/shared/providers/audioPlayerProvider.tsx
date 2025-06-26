"use client";

import { createContext, useContext, useEffect } from "react";
import { useAudioState } from "../hooks/audio/useAudioState";
import { useAudioTrackManage } from "../hooks/audio/useAudioTrackManage";
import { useAudioPlayControl } from "../hooks/audio/useAudioPlayControl";
import { useAudioSeeking } from "../hooks/audio/useAudioSeeking";
import { useAudioVolume } from "../hooks/audio/useAudioVolume";
import { setupAudioEventListeners } from "../lib/audioEventManager";

type AudioPlayerLogicReturnType = ReturnType<typeof useAudioPlayerLogic>;

/*
  TODO:
  FACADE PATTERN SUPER SEXY JUICY
*/

const AudioPlayerContext = createContext<
  AudioPlayerLogicReturnType | undefined
>(undefined);

function useAudioPlayerLogic() {
  const state = useAudioState();
  const { handleSelectTrack } = useAudioTrackManage();
  const { togglePlayPause, nextTrack, prevTrack } = useAudioPlayControl();
  const { seek, isSeekingRef } = useAudioSeeking();
  const { setVolume, toggleMute, setLiveVolume } = useAudioVolume();

  // useEffect Init + Event Listener
  // 의존성 배열에 nextTrack 꼭 추가하세요 클로저 이슈 생깁니다
  useEffect(() => {
    const actions = {
      state,
      isSeekingRef,
      nextTrack,
    };
    const cleanup = setupAudioEventListeners(actions);
    return cleanup;
  }, [state.audio, isSeekingRef, nextTrack]);

  // 컴포넌트 언마운트 시 오디오 인스턴스 정리
  useEffect(() => {
    return () => {
      if (state.cleanAudioInstance) {
        state.cleanAudioInstance();
      }
    };
  }, [state.cleanAudioInstance]);

  return {
    ...state,
    handleSelectTrack,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    setLiveVolume,
  };
}

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const audioPlayerData = useAudioPlayerLogic();
  return (
    <AudioPlayerContext.Provider value={audioPlayerData}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerLogicReturnType => {
  const context = useContext(AudioPlayerContext);
  if (!context)
    throw new Error("useAudioPlayer must be used within a AudioPlayerProvider");
  return context;
};
