import { useCallback } from "react";
import { isEmpty } from "lodash";
import { useAudioState } from "./useAudioState";
import { useTrackManagement } from "./useTrackManagement";

export const usePlaybackControl = () => {
  const { currentTrack, cloudinaryData, audioContext, storeTogglePlayPause } =
    useAudioState();
  const { handleSelectTrack } = useTrackManagement();

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack) return;
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }
    storeTogglePlayPause();
  }, [currentTrack, audioContext]);

  const nextTrack = useCallback(() => {
    if (isEmpty(cloudinaryData)) return;

    const trackEntries = Array.from(cloudinaryData.entries());
    const currentIndex = trackEntries.findIndex(
      ([id]) => id === currentTrack?.assetId
    );

    if (currentIndex === -1) {
      // 현재 트랙이 목록에 없으면 첫 번째 트랙을 재생
      if (trackEntries.length > 0) {
        handleSelectTrack(trackEntries[0][0]);
      }
      return;
    }

    const nextTrackEntry =
      trackEntries[(currentIndex + 1) % trackEntries.length];
    handleSelectTrack(nextTrackEntry[0]);
  }, [cloudinaryData, currentTrack]);

  const prevTrack = useCallback(() => {
    if (isEmpty(cloudinaryData)) return;

    const trackEntries = Array.from(cloudinaryData.entries());
    const currentIndex = trackEntries.findIndex(
      ([id]) => id === currentTrack?.assetId
    );

    if (currentIndex === -1) {
      if (trackEntries.length > 0) {
        handleSelectTrack(trackEntries[0][0]);
      }
      return;
    }

    const prevIndex =
      (currentIndex - 1 + trackEntries.length) % trackEntries.length;
    const prevTrackData = trackEntries[prevIndex];
    handleSelectTrack(prevTrackData[0]);
  }, [cloudinaryData, currentTrack, handleSelectTrack]);

  return {
    togglePlayPause,
    nextTrack,
    prevTrack,
  };
};
