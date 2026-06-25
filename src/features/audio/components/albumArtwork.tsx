/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic Audius CDN hosts. */
import React from "react";
import clsx from "clsx";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const AlbumArtwork: React.FC<Omit<ExtendedAlbumArtworkProps, "isMobile">> = ({
  isPlaying,
  isBuffering,
  currentTrackInfo,
  onClick,
}) => {
  const webAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    return clsx(
      "absolute w-[92px] h-[92px] top-[-22px] ml-[32px]",
      "bg-gray-300",
      "rounded-full overflow-hidden hover:scale-105 shadow-[0_0_0_10px_#fff]",
      "cursor-pointer transform rotate-0 transition-all duration-300 ease-[ease]",
      playing && [
        "active top-[-32px]",
        "shadow-[0_0_0_4px_#fff7f7,_0_30px_50px_-15px_#afb7c1]",
      ],
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
      id="album-art"
      onClick={onClick}
      className={finalClassName}
      aria-label="Toggle player details view"
    >
      {currentTrackInfo?.artworkId ? (
        <img
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
