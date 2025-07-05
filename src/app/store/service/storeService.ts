import {
  AudioPlayerState,
  TrackInfo,
  zustandPersistSet,
  CloudinaryResourceMap,
} from "@/shared/types/dataType";
import { CLAMP_VOLUME } from "@/shared/lib/util";
import { handleOnLike } from "@/shared/lib/util";
import { createJSONStorage } from "zustand/middleware";

const MAX_RECENT_ASSETS = 10;

/* 
TODO:
  Presentation & Container 패턴에 영감을 받아,
  서비스 레이어를 하나 더 만들어서 추상화 진행
  스토어 영역과 비즈니스 로직 영역 관심사 분리 시도
*/

export const createSetStorage = () => ({
  replacer: (key: string, value: any) => {
    if (value instanceof Set) {
      return {
        dataType: "Set",
        value: Array.from(value),
      };
    }
    return value;
  },
  reviver: (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (value.dataType === "Set") {
        return new Set(value.value);
      }
    }
    return value;
  },
});

export const createRecentPlayStorage = () =>
  createJSONStorage(() => localStorage, createSetStorage());

export const setTrack =
  (set: zustandPersistSet) =>
  (track: TrackInfo, playImmediately = false) => {
    if (track.assetId && addRecentAssetId) {
      addRecentAssetId(track.assetId);
    }
    set((state: AudioPlayerState) => ({
      currentTrack: track,
      currentTime: 0,
      isPlaying: playImmediately,
      isBuffering: track.assetId !== "none",
    }));
  };

export const partializeFunction = (state: AudioPlayerState) => ({
  volume: state.volume,
  isMuted: state.isMuted,
  currentTrack: state.currentTrack,
});

export const togglePlayPause = (set: zustandPersistSet) => () =>
  set((state: AudioPlayerState) => ({ isPlaying: !state.isPlaying }));

export const setIsPlaying = (set: zustandPersistSet) => (playing: boolean) =>
  set({ isPlaying: playing });

export const setCurrentTime = (set: zustandPersistSet) => (time: number) =>
  set({ currentTime: time });

export const setDuration = (set: zustandPersistSet) => (duration: number) =>
  set({ duration: duration });

export const setIsBuffering =
  (set: zustandPersistSet) => (buffering: boolean) =>
    set({ isBuffering: buffering });

export const setVolume = (set: zustandPersistSet) => (volume: number) =>
  set({ volume: CLAMP_VOLUME(volume), isMuted: volume === 0 });

export const toggleMute = (set: zustandPersistSet) => () =>
  set((state: AudioPlayerState) => ({
    isMuted: !state.isMuted,
    volume: state.isMuted ? state.volume || 0.5 : 0,
  }));

export const seekTo = (set: zustandPersistSet) => (time: number) =>
  set((state: AudioPlayerState) => ({
    currentTime: Math.min(time, state.duration || 0),
  }));

export const addRecentAssetId = (set: any) => (assetId: string) => {
  set((state: any) => {
    const newRecentAssetIds = new Set([assetId, ...state.recentAssetIds]);
    while (newRecentAssetIds.size > MAX_RECENT_ASSETS) {
      const oldestAssetId = Array.from(newRecentAssetIds).pop();
      if (oldestAssetId) {
        newRecentAssetIds.delete(oldestAssetId);
      }
    }
    return { recentAssetIds: newRecentAssetIds };
  });
};

export const setCloudinaryData = (set: any) => (data: CloudinaryResourceMap) =>
  set((state: any) => {
    const currentData = state.cloudinaryData;
    if (!currentData && !data) return state;
    if (!currentData || !data) {
      return { cloudinaryData: data, isLoadingCloudinary: false };
    }
    if (currentData.size !== data.size) {
      return { cloudinaryData: data, isLoadingCloudinary: false };
    }
    return { ...state, isLoadingCloudinary: false };
  });

export const setCloudinaryError = (set: any) => (error: Error | null) =>
  set({ cloudinaryError: error });

export const setFavorites = (set: any) => (favorites: Set<string>) =>
  set({ favoriteAssetIds: new Set(favorites) });

export const toggleFavorite =
  (set: any, get: any) => async (assetId: string, userId: string) => {
    await handleOnLike(assetId, userId, get, set);
  };
