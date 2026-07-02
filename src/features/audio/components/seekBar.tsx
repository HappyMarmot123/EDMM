"use client";

import React from "react";
import { formatTime } from "@/shared/lib/util";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

export default function SeekBar({ currentTime, duration, seek }: SeekBarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragFraction, setDragFraction] = React.useState(0);

  const fractionFromPointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clampFraction((clientX - rect.left) / rect.width);
  };

  const updateHoverPreview = (clientX: number) => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const rect = container?.getBoundingClientRect();
    if (!container || !tooltip || !rect || !duration) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    container.style.setProperty("--seek-hover-x", `${x}px`);
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = "1";
    tooltip.textContent = formatTime((x / rect.width) * duration);
  };

  const hideHoverPreview = () => {
    containerRef.current?.style.setProperty("--seek-hover-x", "0px");
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragFraction(fractionFromPointer(event.clientX));
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateHoverPreview(event.clientX);
    if (isDragging) setDragFraction(fractionFromPointer(event.clientX));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!isDragging || !duration) return;
    setIsDragging(false);
    seek(fractionFromPointer(event.clientX) * duration);
  };

  const handlePointerCancel = () => setIsDragging(false);

  // Escape → 드래그 취소. 캡처 단계 + stopPropagation으로 풀스크린의
  // window Escape 핸들러(닫기)가 드래그 취소와 동시에 발화하지 않게 한다.
  React.useEffect(() => {
    if (!isDragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isDragging]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!duration) return;
    if (event.key === "ArrowLeft") {
      seek(Math.max(0, currentTime - 5));
    } else if (event.key === "ArrowRight") {
      seek(Math.min(duration, currentTime + 5));
    }
  };

  const playedFraction = isDragging
    ? dragFraction
    : duration > 0
      ? clampFraction(currentTime / duration)
      : 0;
  const playedPercent = playedFraction * 100;
  const shownTime = isDragging ? dragFraction * duration : currentTime;

  return (
    <div
      ref={containerRef}
      data-dragging={isDragging || undefined}
      className="group relative flex h-4 flex-grow cursor-pointer touch-none select-none items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      role="slider"
      aria-label="Seek slider"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={Math.round(shownTime)}
      aria-valuetext={`${formatTime(shownTime)} of ${formatTime(duration)}`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={hideHoverPreview}
      onKeyDown={handleKeyDown}
    >
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[var(--seek-hover-x,0px)] bg-white/25 opacity-0 transition-opacity group-hover:opacity-100 group-data-[dragging]:opacity-100"
        />
        <div
          aria-hidden="true"
          data-testid="seek-played-bar"
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150 ease-out group-hover:bg-[#fd6d94] group-data-[dragging]:bg-[#fd6d94] group-data-[dragging]:transition-none"
          style={{ width: `${playedPercent}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        data-testid="seek-thumb"
        className="absolute top-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full bg-white opacity-0 shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-[120ms] group-hover:scale-100 group-hover:opacity-100 group-data-[dragging]:scale-100 group-data-[dragging]:opacity-100"
        style={{ left: `${playedPercent}%` }}
      />
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 z-10 -translate-x-1/2 rounded bg-black px-2 py-1 text-[12px] text-white opacity-0 shadow-lg transition-opacity"
      />
    </div>
  );
}
