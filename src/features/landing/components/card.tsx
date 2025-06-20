"use client";

import { CloudinaryResource } from "@/shared/types/dataType";
import Image from "next/image";
import useTrackStore from "@/app/store/trackStore";
import { useToggle } from "@/shared/providers/toggleProvider";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import { setFindNewTrack } from "@/shared/lib/audioPlayerUtil";

const Card = ({ card }: { card: CloudinaryResource }) => {
  const { openToggle } = useToggle();
  const setTrack = useTrackStore((state) => state.setTrack);
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);

  const artistName = card.producer;
  const imageUrl = card.album_secure_url;
  const itemName = card.title;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        const newAssetId = card.asset_id;
        if (newAssetId !== currentTrack?.assetId) {
          setFindNewTrack(cloudinaryData, newAssetId, setTrack);
        }
        openToggle();
      }}
      rel="noopener noreferrer"
      className="group relative h-40 w-40 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64 p-3 md:p-4 overflow-hidden bg-neutral-800/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between flex-shrink-0"
    >
      {/* 앨범 아트 표시 */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${itemName} album art`}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
          loading="lazy"
          width={256}
          height={256}
          style={{ height: "auto" }}
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-700 flex items-center justify-center">
          <span className="text-neutral-500 text-sm">No Image</span>
        </div>
      )}
      <div className="relative z-10 flex flex-col justify-between h-full pt-2 pb-3 px-1">
        <h1 className="text-base md:text-lg lg:text-xl font-bold text-white uppercase leading-tight tracking-tight line-clamp-2 mb-1">
          {itemName}
        </h1>
        <p className="text-xs md:text-sm text-neutral-300 font-medium uppercase leading-snug tracking-tight mt-auto line-clamp-1">
          {artistName}
        </p>
      </div>
    </button>
  );
};

export default Card;
