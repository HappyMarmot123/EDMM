"use client";

import React from "react";
import { CLAMP_VOLUME } from "@/shared/lib/util";

interface VolumeBarProps {
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  setLiveVolume: (volume: number) => void;
  toggleMute: () => void;
}

const VOLUME_STEP = 0.05;

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

// 5% 스텝 연산의 부동소수점 오차(0.98 - 0.05 = 0.9299…)를 1% 단위로 정규화
const normalizeVolume = (value: number) =>
  Math.round(CLAMP_VOLUME(value) * 100) / 100;

export default function VolumeBar({
  volume,
  isMuted,
  setVolume,
  setLiveVolume,
  toggleMute,
}: VolumeBarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragFraction, setDragFraction] = React.useState(0);
  const dragOriginVolumeRef = React.useRef(0);

  const shownVolume = isMuted ? 0 : volume;
  const latestRef = React.useRef({ shownVolume, isMuted });
  latestRef.current = { shownVolume, isMuted };

  const unmuteIfNeeded = React.useCallback(
    (nextVolume: number) => {
      if (latestRef.current.isMuted && nextVolume > 0) {
        toggleMute();
      }
    },
    [toggleMute],
  );

  const commitVolume = React.useCallback(
    (nextVolume: number) => {
      const normalized = normalizeVolume(nextVolume);
      setLiveVolume(normalized);
      setVolume(normalized);
    },
    [setLiveVolume, setVolume],
  );

  const fractionFromPointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clampFraction((clientX - rect.left) / rect.width);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragOriginVolumeRef.current = shownVolume;
    const fraction = normalizeVolume(fractionFromPointer(event.clientX));
    setDragFraction(fraction);
    setIsDragging(true);
    setLiveVolume(fraction);
    unmuteIfNeeded(fraction);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const fraction = normalizeVolume(fractionFromPointer(event.clientX));
    setDragFraction(fraction);
    setLiveVolume(fraction);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!isDragging) return;
    setIsDragging(false);
    const fraction = normalizeVolume(fractionFromPointer(event.clientX));
    setLiveVolume(fraction);
    setVolume(fraction);
  };

  const revertDrag = React.useCallback(() => {
    setIsDragging(false);
    setLiveVolume(dragOriginVolumeRef.current);
  }, [setLiveVolume]);

  // Escape → 드래그 취소(라이브 볼륨 원복, 영속화 없음). 캡처 단계 +
  // stopPropagation으로 풀스크린 닫기 Escape와 충돌하지 않게 한다.
  React.useEffect(() => {
    if (!isDragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      revertDrag();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isDragging, revertDrag]);

  // 휠 볼륨 ±5%. React 루트의 wheel 리스너는 passive라 preventDefault가
  // 불가능하므로 비-passive 네이티브 리스너로 부착한다.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      commitVolume(latestRef.current.shownVolume + direction * VOLUME_STEP);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [commitVolume]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    let direction = 0;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") direction = 1;
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") direction = -1;
    if (direction === 0) return;
    event.preventDefault();
    commitVolume(shownVolume + direction * VOLUME_STEP);
  };

  const displayedFraction = isDragging ? dragFraction : clampFraction(shownVolume);
  const displayedPercent = displayedFraction * 100;

  return (
    <div
      ref={containerRef}
      data-dragging={isDragging || undefined}
      className="group relative flex h-4 w-[112px] min-w-[112px] max-w-[112px] cursor-pointer touch-none select-none items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      role="slider"
      aria-label="Volume"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(displayedPercent)}
      aria-valuetext={`${Math.round(displayedPercent)}%`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={revertDrag}
      onKeyDown={handleKeyDown}
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          aria-hidden="true"
          data-testid="volume-fill-bar"
          className="absolute inset-y-0 left-0 rounded-full bg-[#fd6d94] transition-[width] duration-150 ease-out group-data-[dragging]:transition-none"
          style={{ width: `${displayedPercent}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        data-testid="volume-thumb"
        className="absolute top-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full bg-white opacity-0 shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-[120ms] group-hover:scale-100 group-hover:opacity-100 group-data-[dragging]:scale-100 group-data-[dragging]:opacity-100"
        style={{ left: `${displayedPercent}%` }}
      />
    </div>
  );
}
