"use client";

import { CloudinaryResource } from "@/shared/types/dataType";
import Image from "next/image";
import useTrackStore from "@/app/store/trackStore";
import { useToggle } from "@/shared/providers/toggleProvider";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import { setFindNewTrack } from "@/shared/lib/audioPlayerUtil";
import { useCallback } from "react";
import { Play } from "lucide-react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

/* 
  TODO:
  기존의 Absolute 떡칠 요소를 제거하고 그리드로 변경하였습니다. 
  이로써 얻는 이점은 다음과 같습니다.
  - 레이아웃 계산을 GPU에서 처리
  - 부모 크기가 변경될 때 요소 재계산 필요 없음 
  - 전체 레이아웃 정보를 한번에 계산하고 저장
  - 계산 복잡도: O(1)
*/

const Card = ({ card }: { card: CloudinaryResource }) => {
  const { openToggle } = useToggle();
  const { handleSelectTrack } = useAudioPlayer();
  const setTrack = useTrackStore((state) => state.setTrack);
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);

  const handleClickCard = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const notNewAsset = card.asset_id !== currentTrack?.assetId;
      if (notNewAsset) {
        setFindNewTrack(cloudinaryData, card.asset_id, setTrack);
      }
      openToggle();
    },
    [card, currentTrack, cloudinaryData]
  );

  const handleClickButton = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, track: CloudinaryResource) => {
      e.preventDefault();
      e.stopPropagation();
      handleSelectTrack(track.asset_id);
    },
    [handleSelectTrack]
  );

  if (!card.album_secure_url) {
    return (
      <div className="absolute inset-0 bg-neutral-700 flex items-center justify-center">
        <span className="text-neutral-500 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <section
      onClick={handleClickCard}
      rel="noopener noreferrer"
      className="z-10 group relative h-40 w-40 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64 overflow-hidden bg-neutral-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-500 ease-out flex-shrink-0 transform hover:-translate-y-2 grid grid-cols-10 grid-rows-10 border-2 border-white/30"
    >
      <Image
        src={card.album_secure_url}
        alt={`${card.title} album art`}
        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 ease-out"
        loading="lazy"
        width={256}
        height={256}
        style={{ height: "auto" }}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent h-1/2 group-hover:from-black/95 group-hover:via-black/80 transition-all duration-300"></div>

      <button
        aria-label="Play/Pause"
        onClick={(e) => handleClickButton(e, card)}
        className="col-start-5 col-end-7 row-start-5 row-end-7 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <div className="bg-black/80 rounded-full p-3 md:p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 border-2 border-white/70  hover:bg-gray-600/80 cursor-pointer">
          <Play className="w-4 h-4 md:w-6 md:h-6 text-white fill-current" />
        </div>
      </button>

      <div
        aria-label="Title/Producer"
        className="col-span-10 row-start-8 row-end-10 z-10 px-4 py-2 text-left transform group-hover:translate-y-1 transition-transform duration-300"
      >
        <h1 className="text-base md:text-lg lg:text-xl font-bold text-white uppercase leading-tight tracking-tight line-clamp-2 mb-1 group-hover:text-white/90 transition-colors duration-300">
          {card.title}
        </h1>
        <p className="text-xs md:text-sm text-neutral-300 font-medium uppercase leading-snug tracking-tight line-clamp-1 group-hover:text-neutral-200 transition-colors duration-300">
          {card.producer}
        </p>
      </div>
    </section>
  );
};

export default Card;
