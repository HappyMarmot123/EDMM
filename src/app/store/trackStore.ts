import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AudioPlayerState,
  TrackInfo,
  zustandPersistSet,
} from "@/shared/types/dataType";
import {
  togglePlayPause,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsBuffering,
  setVolume,
  toggleMute,
  seekTo,
  partializeFunction,
} from "./service/storeService";
import useRecentPlayStore from "./recentPlayStore";

const setTrack =
  (set: any) =>
  (track: TrackInfo, playImmediately = false) => {
    if (track.assetId) {
      useRecentPlayStore.getState().addRecentAssetId(track.assetId);
    }
    set((state: AudioPlayerState) => ({
      ...state,
      currentTrack: track,
      currentTime: 0,
      isPlaying: playImmediately,
      isBuffering: track.assetId !== "none",
    }));
  };

const useTrackStore = create<AudioPlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      isMuted: false,
      volume: 1,
      isBuffering: false,
      setTrack: setTrack(set),
      togglePlayPause: togglePlayPause(set),
      setIsPlaying: setIsPlaying(set),
      setCurrentTime: setCurrentTime(set),
      setDuration: setDuration(set),
      setIsBuffering: setIsBuffering(set),
      setVolume: setVolume(set),
      toggleMute: toggleMute(set),
      seekTo: seekTo(set),
    }),
    {
      name: "track-store",
      partialize: partializeFunction,
    }
  )
);

export default useTrackStore;
