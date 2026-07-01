/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic CDN hosts. */
import React from "react";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import type { Track } from "@/entities/track";

interface AlbumArtworkProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrackInfo: Track | null;
}

const AlbumArtwork: React.FC<AlbumArtworkProps> = ({
  isPlaying,
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

  const webAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    return clsx(
      "relative h-16 w-16 flex-none overflow-hidden rounded-md bg-white/10",
      "shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/10",
      playing && "shadow-[0_0_0_1px_rgba(253,109,148,0.35),0_18px_34px_rgba(253,109,148,0.18)]",
      buffering && [
        "[&>img]:opacity-25",
      ]
    );
  };

  const finalClassName = webAlbumArtClassName(isPlaying, isBuffering);

  return (
    <button
      type="button"
      id="album-art"
      className={finalClassName}
      aria-label={
        currentTrackInfo
          ? `Open details for ${currentTrackInfo.title}`
        : "No track artwork"
      }
      disabled={!currentTrackInfo}
    >
      {!currentTrackInfo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]">
          <Music2 width={26} height={26} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <img
          key={`${artworkSrc}-${errorRetryCount}`}
          src={artworkSrc}
          alt={currentTrackInfo.albumName ?? currentTrackInfo.source}
          className="absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none"
          draggable={false}
          width={92}
          height={92}
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
          <Music2 width={26} height={26} aria-hidden="true" />
        </span>
      )}
    </button>
  );
};

export default AlbumArtwork;
