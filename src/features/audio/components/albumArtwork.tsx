import React from "react";
import { CldImage } from "next-cloudinary";
import clsx from "clsx";
import { albumArtClassName } from "@/shared/lib/util";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const AlbumArtwork: React.FC<ExtendedAlbumArtworkProps> = ({
  isPlaying,
  isBuffering,
  currentTrackInfo,
  onClick,
}) => {
  return (
    <button
      id="album-art"
      onClick={onClick}
      className={albumArtClassName(isPlaying, isBuffering)}
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
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};

export default AlbumArtwork;
