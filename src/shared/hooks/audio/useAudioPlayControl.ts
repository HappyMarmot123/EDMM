import { useCallback, useEffect } from "react";
import { isEmpty } from "lodash";
import { useAudioState } from "./useAudioState";
import { useAudioTrackManage } from "./useAudioTrackManage";

export const useAudioPlayControl = () => {
  const {
    currentTrack,
    cloudinaryData,
    audioContext,
    audio,
    isPlaying,
    storeTogglePlayPause,
    storeSetCurrentTime,
  } = useAudioState();
  const { handleSelectTrack } = useAudioTrackManage();

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

  // 현재 트랙이 변경되면 오디오 소스를 업데이트
  useEffect(() => {
    const isTrackChanged = currentTrack?.url && audio.src !== currentTrack.url;

    if (isTrackChanged) {
      audio.src = currentTrack.url;
      storeSetCurrentTime(0);
    }
  }, [currentTrack, audio]);

  // 재생 상태가 변경되면 오디오를 재생/일시정지
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch((e) => console.warn("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, audio]);

  return {
    togglePlayPause,
    nextTrack,
    prevTrack,
  };
};
