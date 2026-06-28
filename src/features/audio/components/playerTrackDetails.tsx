import React from "react";
import { PlayerTrackDetailsProps, TrackInfo } from "@/shared/types/dataType";
import { formatTime, handleMouseMove, handleMouseOut } from "@/shared/lib/util";

export const PlayerTrackSummary: React.FC<{
  currentTrackInfo: TrackInfo | null;
}> = ({ currentTrackInfo }) => {
  return (
    <section
      className="min-w-0 overflow-hidden"
      aria-label="Track Information"
    >
      <div
        id="track-name"
        className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
        title={currentTrackInfo?.name}
      >
        {currentTrackInfo?.name ?? "No track selected"}
      </div>
      <div
        id="producer-name"
        className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/55"
        title={currentTrackInfo?.producer}
      >
        {currentTrackInfo?.producer ?? "Choose a song to start playback"}
      </div>
    </section>
  );
};

const PlayerTrackDetails: React.FC<
  Omit<PlayerTrackDetailsProps, "isMobile">
> = ({
  currentTime,
  duration,
  currentProgress,
  seekBarContainerRef,
  seek,
  currentTrackInfo,
}) => {
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
      aria-label={`${currentTrackInfo?.name ?? "Current track"} progress`}
      className="w-full space-y-1.5"
    >
      <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/46">
        <span className="min-w-[2.5rem] text-right text-white/54">
          {formatTime(currentTime)}
        </span>
        <span aria-label="Track duration">{formatTime(duration)}</span>
      </div>

      <section
        id="track-time"
        className="flex w-full items-center gap-2"
        aria-label="Track progress"
      >
        <section
          id="seek-bar-container"
          ref={seekBarContainerRef}
          className="group relative h-2 flex-grow cursor-pointer rounded-full bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#fd6d94] focus:ring-offset-2 focus:ring-offset-black"
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
            className="pointer-events-none absolute bottom-3 z-10 -translate-x-1/2 rounded bg-black px-2 py-1 text-[12px] text-white opacity-0 shadow-lg transition-opacity"
          ></div>
          <div
            id="seek-bar"
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] h-full w-0 rounded-full bg-[#fd6d94] transition-[width] duration-150 ease-out"
            style={{ width: `${currentProgress}%` }}
          ></div>
        </section>
      </section>
    </div>
  );
};

export default PlayerTrackDetails;
