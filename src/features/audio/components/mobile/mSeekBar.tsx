"use client";

import React from "react";
import { useSeekDrag } from "@/features/audio/hooks/useSeekDrag";
import { formatTime } from "@/shared/lib/util";

interface MSeekBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

export default function MSeekBar({ currentTime, duration, seek }: MSeekBarProps) {
  const { containerRef, isDragging, dragFraction, dragHandlers } = useSeekDrag({
    duration,
    seek,
  });

  const playedFraction = isDragging
    ? dragFraction
    : duration > 0
      ? clampFraction(currentTime / duration)
      : 0;
  const playedPercent = playedFraction * 100;
  const shownTime = isDragging ? dragFraction * duration : currentTime;

  return (
    <div>
      <div
        ref={containerRef}
        data-dragging={isDragging || undefined}
        className="group relative flex h-8 cursor-pointer touch-none select-none items-center"
        role="slider"
        aria-label="Seek slider"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={Math.round(shownTime)}
        aria-valuetext={`${formatTime(shownTime)} of ${formatTime(duration)}`}
        {...dragHandlers}
      >
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/22 transition-[height] duration-150 group-data-[dragging]:h-3">
          <div
            aria-hidden="true"
            data-testid="mseek-played-bar"
            className="absolute inset-y-0 left-0 rounded-full bg-[#fd6d94] transition-[width] duration-150 ease-out group-data-[dragging]:transition-none"
            style={{ width: `${playedPercent}%` }}
          />
        </div>
        <div
          aria-hidden="true"
          data-testid="mseek-thumb"
          className="absolute top-1/2 z-[1] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.55)] transition-transform duration-150 group-data-[dragging]:scale-110"
          style={{ left: `${playedPercent}%` }}
        />
      </div>
      <div className="mt-0.5 flex items-center justify-between text-xs font-semibold tabular-nums text-white/54">
        <span
          data-testid="mseek-current-time"
          className={isDragging ? "font-black text-white" : undefined}
        >
          {formatTime(shownTime)}
        </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
