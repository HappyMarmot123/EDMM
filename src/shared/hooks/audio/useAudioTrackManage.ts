import { useCallback, useEffect } from "react";
import { isEmpty } from "lodash";
import {
  type TrackInfo,
  type CloudinaryResourceMap,
} from "@/shared/types/dataType";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";

export const useAudioTrackManage = () => {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const isPlaying = useTrackStore((state) => state.isPlaying);
  const setTrack = useTrackStore((state) => state.setTrack);

  useEffect(() => {
    const hasNoDataOrTrack = isEmpty(cloudinaryData) || currentTrack;
    if (hasNoDataOrTrack) return;

    const firstTrackAssetId = cloudinaryData.keys().next().value;
    if (firstTrackAssetId) {
      findAndSetTrack(cloudinaryData, firstTrackAssetId, setTrack);
    }
  }, [cloudinaryData, currentTrack, setTrack]);

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      if (assetId === currentTrack?.assetId) return;
      findAndSetTrack(cloudinaryData, assetId, setTrack, isPlaying);
    },
    [cloudinaryData, isPlaying, currentTrack, setTrack]
  );

  return { handleSelectTrack };
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
