import { useCallback } from "react";
import { isEmpty } from "lodash";
import { useAudioTrackManage } from "./useAudioTrackManage";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

export const useAudioPlayControl = () => {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const storeTogglePlayPause = useTrackStore((state) => state.togglePlayPause);

  const { handleSelectTrack } = useAudioTrackManage();

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack) return;
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }
    storeTogglePlayPause();
  }, [currentTrack, audioContext, storeTogglePlayPause]);

  const nextTrack = useCallback(() => {
    if (isEmpty(cloudinaryData)) return;

    const trackEntries = Array.from(cloudinaryData.entries());
    const currentIndex = trackEntries.findIndex(
      ([id]) => id === currentTrack?.assetId
    );

    // 현재 트랙이 목록에 없으면 첫 번째 트랙을 재생
    const hasNoCurrentTrack = currentIndex === -1 && trackEntries.length > 0;
    if (hasNoCurrentTrack) {
      handleSelectTrack(trackEntries[0][0]);
      return;
    }

    const nextTrackEntry =
      trackEntries[(currentIndex + 1) % trackEntries.length];
    handleSelectTrack(nextTrackEntry[0]);
  }, [cloudinaryData, currentTrack, handleSelectTrack]);

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
