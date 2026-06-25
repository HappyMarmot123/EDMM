/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic Audius CDN hosts. */
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
      ) : currentTrackInfo.artworkId ? (
        <img
          key={currentTrackInfo.artworkId}
          src={currentTrackInfo.artworkId}
          alt={currentTrackInfo.album}
          className={clsx(
            "absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none",
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
