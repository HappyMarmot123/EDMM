import React from "react";
import Image from "next/image";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import type { Track } from "@/entities/track";
import { shouldUnoptimizeArtworkImage } from "./artworkImage";

interface AlbumArtworkProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrackInfo: Track | null;
}

const FALLBACK_ARTWORK_CLASS_NAME =
  "absolute inset-0 flex items-center justify-center bg-white/10 text-[#fd6d94]";

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
        <span className={FALLBACK_ARTWORK_CLASS_NAME}>
          <Music2 width={26} height={26} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <Image
          key={`${artworkSrc}-${errorRetryCount}`}
          src={artworkSrc}
          alt={currentTrackInfo.albumName ?? currentTrackInfo.source}
          fill
          sizes="92px"
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
          <Music2 width={26} height={26} aria-hidden="true" />
        </span>
      )}
    </button>
  );
};

export default AlbumArtwork;
