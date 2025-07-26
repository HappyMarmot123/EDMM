import { useCallback, useEffect } from "react";
import { isEmpty } from "lodash";
import {
  type TrackInfo,
  type CloudinaryResourceMap,
} from "@/shared/types/dataType";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

export const useAudioTrackManage = () => {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const {
    currentTrack,
    isPlaying,
    setTrack,
    togglePlayPause: storeTogglePlayPause,
  } = useTrackStore();
  const { audioContext } = useAudioInstanceStore();

  useEffect(() => {
    const hasNoDataOrTrack = isEmpty(cloudinaryData) || currentTrack;
    if (hasNoDataOrTrack) return;

    const firstTrackAssetId = cloudinaryData.keys().next().value;
    if (firstTrackAssetId) {
      findAndSetTrack(cloudinaryData, firstTrackAssetId, setTrack);
    }
  }, [cloudinaryData, currentTrack, setTrack]);

  const handleSelectTrack = (assetId: string) => {
    if (assetId === currentTrack?.assetId) return;
    findAndSetTrack(cloudinaryData, assetId, setTrack, isPlaying);
  };

  const playNextTrack = () => {
    if (isEmpty(cloudinaryData)) return;
    const trackEntries = Array.from(cloudinaryData.keys());
    const currentIndex = currentTrack
      ? trackEntries.findIndex((id) => id === currentTrack.assetId)
      : -1;
    const nextIndex = (currentIndex + 1) % trackEntries.length;
    const nextAssetId = trackEntries[nextIndex];
    findAndSetTrack(cloudinaryData, nextAssetId, setTrack, isPlaying);
  };

  const playPrevTrack = () => {
    if (isEmpty(cloudinaryData)) return;
    const trackEntries = Array.from(cloudinaryData.keys());
    const currentIndex = currentTrack
      ? trackEntries.findIndex((id) => id === currentTrack.assetId)
      : -1;
    const prevIndex =
      (currentIndex - 1 + trackEntries.length) % trackEntries.length;
    const prevAssetId = trackEntries[prevIndex];
    findAndSetTrack(cloudinaryData, prevAssetId, setTrack, isPlaying);
  };

  const togglePlayPause = async () => {
    if (!currentTrack) {
      return;
    }

    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }

    storeTogglePlayPause();
  };

  return {
    handleSelectTrack,
    playNextTrack,
    playPrevTrack,
    togglePlayPause,
  };
};

const findAndSetTrack = (
  cloudinaryData: CloudinaryResourceMap,
  assetId: string,
  setTrack: (track: TrackInfo, playImmediately: boolean) => void,
  isPlaying?: boolean
) => {
  if (isEmpty(cloudinaryData)) {
    console.error("Cloudinary data is empty");
    return;
  }
  const findTrackInData = cloudinaryData.get(assetId);
  if (!findTrackInData) {
    console.error("Track not found in cloudinary data:", assetId);
    return;
  }
  const newTrackInfo: TrackInfo = {
    assetId: findTrackInData.asset_id,
    album: findTrackInData.context.caption,
    name: findTrackInData.title,
    artworkId: findTrackInData.album_secure_url,
    url: findTrackInData.secure_url,
    producer: findTrackInData.producer,
  };
  setTrack(newTrackInfo, isPlaying || false);
};
