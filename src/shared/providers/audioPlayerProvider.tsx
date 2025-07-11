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
import {
  AudioPlayerState,
  CloudinaryStoreState,
  AudioInstanceState,
} from "@/shared/types/dataType";

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
  // 1. Setup side effects
  useAudioEffects();

  // 2. State selection
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const isPlaying = useTrackStore((state) => state.isPlaying);
  const currentTime = useTrackStore((state) => state.currentTime);
  const duration = useTrackStore((state) => state.duration);
  const isBuffering = useTrackStore((state) => state.isBuffering);
  const volume = useTrackStore((state) => state.volume);
  const isMuted = useTrackStore((state) => state.isMuted);

  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const isLoadingCloudinary = useCloudinaryStore(
    (state) => state.isLoadingCloudinary
  );

  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const analyserNode = useAudioInstanceStore((state) => state.audioAnalyser);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);

  // 3. Actions from custom hooks
  const { handleSelectTrack } = useAudioTrackManage();
  const { togglePlayPause, nextTrack, prevTrack } = useAudioPlayControl();
  const { seek } = useAudioSeeking();
  const { setVolume, toggleMute, setLiveVolume } = useAudioVolume();

  // 4. Memoize the context value
  return useMemo(
    () => ({
      // State
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      isBuffering,
      volume,
      isMuted,
      cloudinaryData,
      isLoadingCloudinary,
      audio,
      analyserNode,
      audioContext,
      // Actions
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
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      isBuffering,
      volume,
      isMuted,
      cloudinaryData,
      isLoadingCloudinary,
      audio,
      analyserNode,
      audioContext,
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
