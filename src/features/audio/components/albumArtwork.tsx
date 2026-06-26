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
      ) : currentTrackInfo.artworkId ? (
        <img
          key={currentTrackInfo.artworkId}
          src={currentTrackInfo.artworkId}
          alt={currentTrackInfo.album}
          className="absolute inset-0 z-[1] block h-full w-full object-cover opacity-100 select-none"
          draggable={false}
          width={92}
          height={92}
          loading="lazy"
        />
      ) : (
        <div
          id="buffer-box"
          className={clsx(
            "absolute top-1/2 right-0 left-0 text-white text-sm font-medium text-center p-2 mt-[-16px] mx-auto backdrop-blur-sm rounded-lg z-[2] transition-all duration-300 pointer-events-none flex items-center justify-center animate-pulse"
          )}
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading audio...</span>
          <div
            className={clsx(
              "border-white border-t-transparent rounded-full animate-spin",
              "w-8 h-8 border-4"
            )}
          />
        </div>
      )}
    </button>
  );
};

export default AlbumArtwork;
