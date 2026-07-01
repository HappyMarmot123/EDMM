import React from "react";
import { formatTime, handleMouseMove, handleMouseOut } from "../lib/util";

interface TrackSeekBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

export default function TrackSeekBar({
  currentTime,
  duration,
  seek,
}: TrackSeekBarProps) {
  const seekBarContainerRef = React.useRef<HTMLDivElement>(null);
  const seekTimeTooltipRef = React.useRef<HTMLDivElement>(null);
  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
    <section aria-label="재생 진행 막대" className="w-full mt-6 mb-2">
      <div
        id="seek-bar-container"
        ref={seekBarContainerRef}
        className="no-drag relative h-[8px] rounded-[4px] bg-[#d6dee7] cursor-pointer group mx-2 flex-grow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fd6d94]"
        onClick={handleSeekInteraction}
        onMouseMove={(e) =>
          handleMouseMove(e, seekBarContainerRef, seekTimeTooltipRef, duration)
        }
        onMouseOut={() =>
          handleMouseOut(seekTimeTooltipRef, seekBarContainerRef)
        }
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
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
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 mx-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </section>
  );
}
