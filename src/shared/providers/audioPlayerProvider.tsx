"use client";

import { createContext, useContext } from "react";
import { useAudioState } from "../hooks/audio/useAudioState";
import { useTrackManagement } from "../hooks/audio/useTrackManagement";
import { usePlaybackControl } from "../hooks/audio/usePlaybackControl";
import { useAudioSeeking } from "../hooks/audio/useAudioSeeking";
import { useAudioVolume } from "../hooks/audio/useAudioVolume";
import { useAudioLifecycle } from "../hooks/audio/useAudioLifecycle";

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
  const { handleSelectTrack } = useTrackManagement();
  const { togglePlayPause, nextTrack, prevTrack } = usePlaybackControl();
  const { seek, isSeekingRef } = useAudioSeeking();
  const { setVolume, toggleMute, setLiveVolume } = useAudioVolume();

  // useEffect Init + Event Listener
  useAudioLifecycle({ isSeekingRef });

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
