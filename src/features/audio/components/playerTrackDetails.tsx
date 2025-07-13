import React from "react";
import { PlayerTrackDetailsProps } from "@/shared/types/dataType";
import clsx from "clsx";
import { formatTime, handleMouseMove, handleMouseOut } from "@/shared/lib/util";

const PlayerTrackDetails: React.FC<PlayerTrackDetailsProps> = ({
  isPlaying,
  currentTime,
  duration,
  currentProgress,
  seekBarContainerRef,
  seek,
  isMobile,
  currentTrackInfo,
}) => {
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col justify-center min-w-0 mx-3">
        <div className="flex items-baseline">
          <span className="text-sm font-bold text-slate-800 truncate">
            {currentTrackInfo?.name}
          </span>
        </div>
        <div className="flex text-xs text-slate-400 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  const seekTimeTooltipRef = React.useRef<HTMLDivElement>(null);

  const handleSeekInteraction = (event: React.MouseEvent<HTMLElement>) => {
    if (!seekBarContainerRef.current || !duration) return;

    const rect = seekBarContainerRef.current.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const seekFraction = clickPosition / rect.width;
    const seekTime = seekFraction * duration;
    seek(seekTime);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!duration) return;
    if (event.key === "ArrowLeft") {
      seek(Math.max(0, currentTime - 5));
    } else if (event.key === "ArrowRight") {
      seek(Math.min(duration, currentTime + 5));
    }
  };

  return (
    <div
      id="player-track"
      className={clsx(
        "absolute right-[15px] left-[15px] pt-[6px] pr-[22px] pb-[16px] pl-[147px] bg-white rounded-t-[15px] transition-transform duration-300 ease-in-out z-[1]",
        isPlaying ? "translate-y-[-40px]" : "translate-y-0"
      )}
    >
      <section
        id="track-time"
        className={clsx(
          "flex items-center w-full py-2",
          (isPlaying || currentTime > 0) &&
            "active [&>div]:text-[#f86d92] [&>div]:bg-transparent"
        )}
        aria-label="Track progress"
      >
        <div
          id="current-time"
          className="text-transparent text-[11px] bg-[#ffe8ee] rounded-[10px] transition-colors,background-color duration-300 ease-in-out px-1"
          aria-live="polite"
        >
          {formatTime(currentTime)}
        </div>
        <section
          id="seek-bar-container"
          ref={seekBarContainerRef}
          className="no-drag relative h-[8px] rounded-[4px] bg-[#ffe8ee] cursor-pointer group mx-2 flex-grow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fd6d94]"
          onClick={handleSeekInteraction}
          onMouseMove={(e) =>
            handleMouseMove(
              e,
              seekBarContainerRef,
              seekTimeTooltipRef,
              duration
            )
          }
          onMouseOut={() =>
            handleMouseOut(seekTimeTooltipRef, seekBarContainerRef)
          }
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(
            duration
          )}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div
            id="seek-time"
            ref={seekTimeTooltipRef}
            className="absolute bottom-[10px] text-white text-[12px] whitespace-pre p-[5px] rounded-[4px] bg-[#3b3d50] transform -translate-x-1/2 z-10 pointer-events-none opacity-0 transition-opacity"
          ></div>
          <div
            id="seek-bar"
            className="absolute inset-0 left-0 h-full w-0 bg-[#fd6d94] rounded-[4px] transition-width duration-200 ease-in-out z-[1] pointer-events-none"
            style={{ width: `${currentProgress}%` }}
          ></div>
        </section>
        <div
          id="track-length"
          className="text-transparent text-[11px] bg-[#ffe8ee] rounded-[10px] transition-colors,background-color duration-300 ease-in-out px-1"
        >
          {formatTime(duration)}
        </div>
      </section>
    </div>
  );
};

export default PlayerTrackDetails;
