import {
  CloudinaryResource,
  CloudinaryResourceMap,
} from "@/shared/types/dataType";
import Image from "next/image";
import clsx from "clsx";
import React, { useCallback } from "react";
import useTrackStore from "@/app/store/trackStore";
import { useAuth } from "@/app/providers/authProvider";
import LoadingView from "../../../features/listModal/components/loadingView";
import EmptyView from "../../../features/listModal/components/emptyView";
import { LikeButton } from "@/shared/components/likeButton";

interface ModalMusicListProps {
  isLoading: boolean;
  trackList: CloudinaryResourceMap;
  favoriteAssetIds: Set<string>;
  toggleFavorite: (assetId: string) => void;
  handleSelectTrack: (assetId: string) => void;
}

const ModalMusicList = ({
  isLoading,
  trackList,
  favoriteAssetIds,
  toggleFavorite,
  handleSelectTrack,
}: ModalMusicListProps) => {
  const { role } = useAuth();
  const { currentTrack } = useTrackStore();

  const handleOnClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, track: CloudinaryResource) => {
      e.preventDefault();
      handleSelectTrack(track.asset_id);
    },
    [handleSelectTrack]
  );

  const isCurrentTrackStyle = (track: CloudinaryResource) => {
    return currentTrack?.assetId === track.asset_id ? "bg-white/10" : "";
  };

  const initFavorite = (track: CloudinaryResource) => {
    return favoriteAssetIds.has(track.asset_id);
  };

  if (isLoading) {
    return <LoadingView />;
  }

  if (trackList.size === 0) {
    return <EmptyView />;
  }

  console.log("🚀 ~ ModalMusicList ~ trackList:", trackList);
  return (
    <>
      {Array.from(trackList.values()).map((track) => (
        <div
          key={track.asset_id}
          onClick={(e) => handleOnClick(e, track)}
          className={clsx(
            isCurrentTrackStyle(track),
            "flex items-center p-3 rounded-lg ",
            "hover:bg-white/10 transition cursor-pointer"
          )}
        >
          <Image
            src={track?.album_secure_url}
            alt={track.title}
            width={48}
            height={48}
            className="rounded-md mr-4"
          />

          <div className="flex-1">
            <h3 className="font-medium">{track.title}</h3>
            <p className="text-sm text-gray-400">{track.producer}</p>
          </div>

          <div className="relative flex items-center space-x-2">
            <LikeButton
              track={track}
              role={role}
              isFavorite={initFavorite(track)}
              toggleFavorite={toggleFavorite}
            />
            <span className="text-gray-400 text-sm">128</span>
          </div>
        </div>
      ))}
    </>
  );
};

export default React.memo(ModalMusicList);
