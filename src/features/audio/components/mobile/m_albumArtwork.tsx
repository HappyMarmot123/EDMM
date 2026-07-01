/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic CDN hosts. */
"use client";

import React from "react";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const MAlbumArtwork: React.FC<Omit<ExtendedAlbumArtworkProps, "isMobile">> = ({
  isBuffering,
  currentTrackInfo,
}) => {
  const artworkSrc = currentTrackInfo?.artworkUrl?.trim() ?? "";
  const [hasArtworkError, setHasArtworkError] = React.useState(false);
  const [errorRetryCount, setErrorRetryCount] = React.useState(0);

  React.useEffect(() => {
    setHasArtworkError(false);
    setErrorRetryCount(0);
  }, [artworkSrc]);

  const shouldRenderArtwork = Boolean(artworkSrc) && !hasArtworkError;

  const mobileAlbumArtClassName = (buffering: boolean) => {
    const baseClasses =
      "relative z-[1] overflow-hidden rounded-md shadow-[0_10px_24px_rgba(0,0,0,0.32)] ring-1 ring-white/10 select-none";
    const mobileClasses = "w-[54px] h-[54px]";

    let stateClasses = "";
    if (buffering) {
      stateClasses = "[&>img]:opacity-25";
    }

    return clsx(baseClasses, mobileClasses, stateClasses);
  };

  const finalClassName = mobileAlbumArtClassName(isBuffering);

  return (
    <div
      id="album-art"
      className={finalClassName}
      aria-label={
        currentTrackInfo
          ? `Open details for ${currentTrackInfo.title}`
          : "No track artwork"
      }
    >
      {!currentTrackInfo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]">
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <img
          key={`${artworkSrc}-${errorRetryCount}`}
          src={artworkSrc}
          alt={currentTrackInfo.albumName ?? currentTrackInfo.source}
          className="absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none"
          draggable={false}
          width={54}
          height={54}
          loading="lazy"
          onError={() =>
            setErrorRetryCount((retryCount) => {
              if (retryCount >= 1) {
                setHasArtworkError(true);
                return retryCount;
              }

              return retryCount + 1;
            })
          }
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]">
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

export default MAlbumArtwork;
