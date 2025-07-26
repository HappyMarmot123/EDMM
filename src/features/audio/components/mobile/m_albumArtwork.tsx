"use client";

import React from "react";
import { CldImage } from "next-cloudinary";
import clsx from "clsx";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const MAlbumArtwork: React.FC<Omit<ExtendedAlbumArtworkProps, "isMobile">> = ({
  isPlaying,
  isBuffering,
  currentTrackInfo,
  onClick,
}) => {
  const mobileAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    const baseClasses =
      "relative z-[1] overflow-hidden rounded-full cursor-pointer shadow-lg select-none";
    const mobileClasses = "w-[54px] h-[54px]";
    const animationClasses =
      "before:absolute before:top-1/2 before:left-1/2 before:w-[20px] before:h-[20px] before:mt-[-10px] before:ml-[-10px] before:bg-white before:rounded-full before:z-[2]";

    let stateClasses = "";
    if (buffering) {
      stateClasses =
        "before:animate-scale-up-down before:bg-transparent before:border-2 before:border-white before:border-t-transparent before:animate-spin";
    } else if (playing) {
      stateClasses = "before:animate-scale-up-down active";
    }

    return clsx(baseClasses, mobileClasses, stateClasses, animationClasses);
  };

  const finalClassName = mobileAlbumArtClassName(isPlaying, isBuffering);

  return (
    <button
      id="album-art"
      onClick={onClick}
      className={finalClassName}
      aria-label="Toggle player details view"
    >
      {currentTrackInfo?.artworkId ? (
        <CldImage
          key={currentTrackInfo.artworkId}
          src={currentTrackInfo.artworkId}
          alt={currentTrackInfo.album}
          className={clsx(
            "block absolute top-0 left-0 w-full h-full opacity-100 z-[1] select-none",
            isPlaying && "animate-rotate-album active"
          )}
          draggable={false}
          width={54}
          height={54}
          loading="lazy"
        />
      ) : (
        <div
          id="buffer-box"
          className={clsx(
            "absolute inset-0 flex items-center justify-center bg-gray-800/50 text-white z-[2] pointer-events-none"
          )}
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading audio...</span>
          <div
            className={clsx(
              "border-white border-t-transparent rounded-full animate-spin",
              "w-6 h-6 border-2"
            )}
          />
        </div>
      )}
    </button>
  );
};

export default MAlbumArtwork;
