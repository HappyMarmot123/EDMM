/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic CDN hosts. */
import React from "react";
import clsx from "clsx";
import { Music2 } from "lucide-react";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const AlbumArtwork: React.FC<Omit<ExtendedAlbumArtworkProps, "isMobile">> = ({
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

  const webAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    return clsx(
      "relative h-16 w-16 flex-none overflow-hidden rounded-md bg-white/10",
      "shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/10",
      "cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      "disabled:pointer-events-none disabled:cursor-default disabled:opacity-50",
      playing && "shadow-[0_0_0_1px_rgba(253,109,148,0.35),0_18px_34px_rgba(253,109,148,0.18)]",
      buffering && [
        "buffering",
        "[&>img]:opacity-25",
        "[&>img.active]:opacity-80",
        "[&>img.active]:blur-sm",
        "[&_#buffer-box]:opacity-100",
      ]
    );
  };

  const finalClassName = webAlbumArtClassName(isPlaying, isBuffering);

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
          <Music2 width={26} height={26} aria-hidden="true" />
        </span>
      ) : shouldRenderArtwork ? (
        <img
          key={artworkSrc}
          src={artworkSrc}
          alt={currentTrackInfo.album}
          className="absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none"
          draggable={false}
          width={92}
          height={92}
          loading="lazy"
          onError={() => setHasArtworkError(true)}
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
