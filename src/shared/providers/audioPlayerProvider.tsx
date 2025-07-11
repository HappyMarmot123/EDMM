"use client";

import { createContext, useContext, useMemo } from "react";
import { useAudioTrackManage } from "../hooks/audio/useAudioTrackManage";
import { useAudioPlayControl } from "../hooks/audio/useAudioPlayControl";
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

type AudioPlayerLogicReturnType = {
  // State from stores
  currentTrack: AudioPlayerState["currentTrack"];
  isPlaying: AudioPlayerState["isPlaying"];
  currentTime: AudioPlayerState["currentTime"];
  duration: AudioPlayerState["duration"];
  isBuffering: AudioPlayerState["isBuffering"];
  volume: AudioPlayerState["volume"];
  isMuted: AudioPlayerState["isMuted"];
  cloudinaryData: CloudinaryStoreState["cloudinaryData"];
  isLoadingCloudinary: CloudinaryStoreState["isLoadingCloudinary"];
  audio: AudioInstanceState["audioInstance"];
  analyserNode: AudioInstanceState["audioAnalyser"];
  audioContext: AudioInstanceState["audioContext"];
  // Actions from hooks
  handleSelectTrack: ReturnType<
    typeof useAudioTrackManage
  >["handleSelectTrack"];
  togglePlayPause: ReturnType<typeof useAudioPlayControl>["togglePlayPause"];
  nextTrack: ReturnType<typeof useAudioPlayControl>["nextTrack"];
  prevTrack: ReturnType<typeof useAudioPlayControl>["prevTrack"];
  seek: ReturnType<typeof useAudioSeeking>["seek"];
  setVolume: ReturnType<typeof useAudioVolume>["setVolume"];
  toggleMute: ReturnType<typeof useAudioVolume>["toggleMute"];
  setLiveVolume: ReturnType<typeof useAudioVolume>["setLiveVolume"];
};

const AudioPlayerContext = createContext<
  AudioPlayerLogicReturnType | undefined
>(undefined);

function useAudioPlayerLogic(): AudioPlayerLogicReturnType {
  useAudioEffects(); // 사이드 이펙트

  const trackState = useTrackStore((state) => state);
  const cloudinaryState = useCloudinaryStore((state) => state);
  const audioState = useAudioInstanceStore((state) => state);

  const { handleSelectTrack } = useAudioTrackManage();
  const { togglePlayPause, nextTrack, prevTrack } = useAudioPlayControl();
  const { seek } = useAudioSeeking();
  const { setVolume, toggleMute, setLiveVolume } = useAudioVolume();

  return useMemo(
    () => ({
      ...trackState,
      ...cloudinaryState,
      ...audioState,
      handleSelectTrack,
      togglePlayPause,
      nextTrack,
      prevTrack,
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
      nextTrack,
      prevTrack,
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
