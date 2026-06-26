/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic CDN hosts. */
"use client";

import React from "react";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const MAlbumArtwork: React.FC<Omit<ExtendedAlbumArtworkProps, "isMobile">> = ({
  isPlaying,
  isBuffering,
  currentTrackInfo,
  onClick,
}) => {
  const artworkSrc = currentTrackInfo?.artworkId?.trim() ?? "";
  const [hasArtworkError, setHasArtworkError] = React.useState(false);

  React.useEffect(() => {
    setHasArtworkError(false);
  }, [artworkSrc]);

  const shouldRenderArtwork = Boolean(artworkSrc) && !hasArtworkError;

  const mobileAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    const baseClasses =
      "relative z-[1] overflow-hidden rounded-md cursor-pointer shadow-[0_10px_24px_rgba(0,0,0,0.32)] ring-1 ring-white/10 select-none disabled:pointer-events-none disabled:cursor-default disabled:opacity-50";
    const mobileClasses = "w-[54px] h-[54px]";
    const animationClasses =
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

    let stateClasses = "";
    if (buffering) {
      stateClasses =
        "[&>img]:opacity-25 [&_#buffer-box]:opacity-100";
    } else if (playing) {
      stateClasses = "active";
    }

    return clsx(baseClasses, mobileClasses, stateClasses, animationClasses);
  };

  const finalClassName = mobileAlbumArtClassName(isPlaying, isBuffering);

  return (
    <button
      type="button"
      id="album-art"
      onClick={onClick}
      className={finalClassName}
      aria-label={
        currentTrackInfo
          ? `Open details for ${currentTrackInfo.name}`
          : "No track artwork"
      }
      disabled={!currentTrackInfo}
    >
      {!currentTrackInfo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]">
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <img
          key={artworkSrc}
          src={artworkSrc}
          alt={currentTrackInfo.album}
          className={clsx(
            "absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none",
            isPlaying && "animate-rotate-album active"
          )}
          draggable={false}
          width={54}
          height={54}
          loading="lazy"
          onError={() => setHasArtworkError(true)}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]">
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      )}
    </button>
  );
};

export default MAlbumArtwork;
