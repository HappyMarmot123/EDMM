"use client";

import { CloudinaryResource } from "@/shared/types/dataType";
import useTrackStore from "@/app/store/trackStore";
import { useToggle } from "@/shared/providers/toggleProvider";
import { useAudioTrackManage } from "@/shared/hooks/audio/useAudioTrackManage";
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
  const { handleSelectTrack } = useAudioTrackManage();
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const { togglePlayPause, isPlaying } = useAudioPlayer();

  const handleClickCard = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      const newAsset = card.asset_id !== currentTrack?.assetId;
      if (newAsset) {
        handleSelectTrack(card.asset_id);
      }
      openToggle();
    },
    [card, currentTrack]
  );

  const handleClickButton = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, track: CloudinaryResource) => {
      e.preventDefault();
      e.stopPropagation();
      const newAsset = track.asset_id !== currentTrack?.assetId;
      if (newAsset) {
        handleSelectTrack(track.asset_id);
      } else {
        return togglePlayPause();
      }
      if (!isPlaying) {
        togglePlayPause();
      }
    },
    [currentTrack, isPlaying]
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
