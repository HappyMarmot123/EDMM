"use client";

import React from "react";
import Image from "next/image";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import type { Track } from "@/entities/track";
import { shouldUnoptimizeArtworkImage } from "@/features/audio/components/artworkImage";

interface MAlbumArtworkProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrackInfo: Track | null;
}

const FALLBACK_ARTWORK_CLASS_NAME =
  "absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]";

const MAlbumArtwork: React.FC<MAlbumArtworkProps> = ({
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
        <span className={FALLBACK_ARTWORK_CLASS_NAME}>
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <Image
          key={`${artworkSrc}-${errorRetryCount}`}
          src={artworkSrc}
          alt={currentTrackInfo.albumName ?? currentTrackInfo.source}
          fill
          sizes="54px"
          unoptimized={shouldUnoptimizeArtworkImage(artworkSrc)}
          className="z-[1] object-cover opacity-100 select-none"
          draggable={false}
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
        <span className={FALLBACK_ARTWORK_CLASS_NAME}>
          <Music2 width={22} height={22} aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

export default MAlbumArtwork;
