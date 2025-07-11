import { createWithEqualityFn } from "zustand/traditional";
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";
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
  partializeFunction,
} from "./service/storeService";
import { shallow } from "zustand/shallow";
import {
  type TrackInfo,
  type CloudinaryResource,
} from "@/shared/types/dataType";

const useTrackStore = createWithEqualityFn<AudioPlayerState>()(
  subscribeWithSelector(
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
  )
);

export default useTrackStore;
