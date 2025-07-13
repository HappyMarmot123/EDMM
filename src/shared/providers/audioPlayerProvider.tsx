"use client";

import { createContext, useContext, useMemo } from "react";
import { useAudioTrackManage } from "../hooks/audio/useAudioTrackManage";
import { useAudioSeeking } from "../hooks/audio/useAudioSeeking";
import { useAudioVolume } from "../hooks/audio/useAudioVolume";
import { useAudioEffects } from "../hooks/audio/useAudioEffects";
import useTrackStore from "@/app/store/trackStore";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { AudioPlayerLogicReturnType } from "../types/dataType";

/*
  TODO:
  FACADE PATTERN SUPER SEXY JUICY
*/

const AudioPlayerContext = createContext<
  AudioPlayerLogicReturnType | undefined
>(undefined);

function useAudioPlayerLogic(): AudioPlayerLogicReturnType {
  useAudioEffects(); // 사이드 이펙트

  const trackState = useTrackStore((state) => state);
  const cloudinaryState = useCloudinaryStore((state) => state);
  const audioState = useAudioInstanceStore((state) => state);

  const { handleSelectTrack, playNextTrack, playPrevTrack, togglePlayPause } =
    useAudioTrackManage();
  const { seek } = useAudioSeeking();
  const { setVolume, toggleMute, setLiveVolume } = useAudioVolume();
  console.log(trackState.currentTrack);
  return useMemo(
    () => ({
      ...trackState,
      ...cloudinaryState,
      ...audioState,
      handleSelectTrack,
      togglePlayPause,
      nextTrack: playNextTrack,
      prevTrack: playPrevTrack,
      seek,
      setVolume,
      toggleMute,
      setLiveVolume,
    }),
    [
      trackState,
      cloudinaryState,
      audioState,
      handleSelectTrack,
      togglePlayPause,
      playNextTrack,
      playPrevTrack,
      seek,
      setVolume,
      toggleMute,
      setLiveVolume,
    ]
  );
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
