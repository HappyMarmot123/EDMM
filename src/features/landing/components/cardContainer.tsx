"use client";

import { CloudinaryResource } from "@/shared/types/dataType";
import useTrackStore from "@/app/store/trackStore";
import { useToggle } from "@/shared/providers/toggleProvider";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import { setFindNewTrack } from "@/shared/lib/audioPlayerUtil";
import { useCallback } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { Card } from "@/features/landing/atoms/cardPresentation";

/* 
  TODO:
  Presentation & Container 패턴 적용
  Configuration Object (설정 객체) 패턴 적용

  컴포넌트 레이어에 필요한 하위 컴포넌트를 원자 단위로 분리해서 atoms 레이어로 관리
  FSD 패턴에 맞춰 shared 레이어로 분리할 의향 있음
*/

export const CardContainer = ({ card }: { card: CloudinaryResource }) => {
  const { openToggle } = useToggle();
  const { handleSelectTrack } = useAudioPlayer();
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const setTrack = useTrackStore((state) => state.setTrack);
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);

  const handleClickCard = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      const notNewAsset = card.asset_id !== currentTrack?.assetId;
      if (notNewAsset) {
        setFindNewTrack(cloudinaryData, card.asset_id, setTrack);
      }
      openToggle();
    },
    [card, currentTrack]
  );

  const handleClickButton = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, track: CloudinaryResource) => {
      e.preventDefault();
      e.stopPropagation();
      handleSelectTrack(track.asset_id);
    },
    []
  );

  let props = {
    card,
    handleClickCard,
    handleClickButton,
  };

  if (!card.album_secure_url) {
    return (
      <div className="relative h-40 w-40 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64 bg-neutral-700 flex items-center justify-center rounded-lg shadow-md border-2 border-white/30">
        <span className="text-neutral-500 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <Card {...props}>
      <Card.CardImage />
      <Card.CardOverlay />
      <Card.CardPlayButton />
      <Card.CardDetails />
    </Card>
  );
};
