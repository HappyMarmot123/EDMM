import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from "zustand/middleware";
import { AudioPlayerState, zustandPersistSet } from "@/shared/types/dataType";
import { mergeFunction } from "@/shared/lib/util";
import {
  setTrack,
  togglePlayPause,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsBuffering,
  setVolume,
  toggleMute,
  seekTo,
} from "./service/storeService";

const partializeFunction = (state: AudioPlayerState) => ({
  volume: state.volume,
  isMuted: state.isMuted,
  currentTrack: state.currentTrack,
});

const useTrackStore = createWithEqualityFn<AudioPlayerState>()(
  persist(
    (set: zustandPersistSet) => ({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      volume: 0.7,
      isMuted: false,

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
      name: "track-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: partializeFunction,
      merge: mergeFunction,
    }
  )
);

export default useTrackStore;
