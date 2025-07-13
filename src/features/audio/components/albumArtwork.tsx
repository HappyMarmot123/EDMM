import React from "react";
import { CldImage } from "next-cloudinary";
import clsx from "clsx";
import { ExtendedAlbumArtworkProps } from "@/shared/types/dataType";

const AlbumArtwork: React.FC<ExtendedAlbumArtworkProps> = ({
  isPlaying,
  isBuffering,
  currentTrackInfo,
  onClick,
  isMobile,
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

  const mobileAlbumArtClassName = (playing: boolean, buffering: boolean) => {
    const baseClasses =
      "relative z-[1] overflow-hidden rounded-full cursor-pointer shadow-lg select-none";
    const desktopClasses = "w-[92px] h-[92px]";
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

    return clsx(
      baseClasses,
      isMobile ? mobileClasses : desktopClasses,
      stateClasses,
      isMobile && animationClasses
    );
  };

  const finalClassName = isMobile
    ? mobileAlbumArtClassName(isPlaying, isBuffering)
    : webAlbumArtClassName(isPlaying, isBuffering);

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
          width={isMobile ? 54 : 92}
          height={isMobile ? 54 : 92}
          loading="lazy"
        />
      ) : (
        <div
          id="buffer-box"
          className={clsx(
            isMobile
              ? "absolute inset-0 flex items-center justify-center bg-gray-800/50 text-white z-[2] pointer-events-none"
              : "absolute top-1/2 right-0 left-0 text-white text-sm font-medium text-center p-2 mt-[-16px] mx-auto backdrop-blur-sm rounded-lg z-[2] transition-all duration-300 pointer-events-none flex items-center justify-center animate-pulse"
          )}
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Loading audio...</span>
          <div
            className={clsx(
              "border-white border-t-transparent rounded-full animate-spin",
              isMobile ? "w-6 h-6 border-2" : "w-8 h-8 border-4"
            )}
          />
        </div>
      )}
    </button>
  );
};

export default AlbumArtwork;
