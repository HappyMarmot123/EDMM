"use client";

import React from "react";

type UseSeekDragParams = {
  duration: number;
  seek: (time: number) => void;
};

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

/**
 * seek 바 공용 드래그 로직 (데스크톱 SeekBar / 모바일 MSeekBar 공유).
 * - pointer capture 기반 드래그, 시각 프리뷰만 갱신하고 오디오 seek는 릴리즈 시 1회 commit
 * - Escape로 드래그 취소 (캡처 단계 + stopPropagation — 풀스크린 닫기 Escape와 충돌 방지)
 * - jsdom/구형 브라우저 대비 setPointerCapture 옵셔널 가드
 */
export function useSeekDrag({ duration, seek }: UseSeekDragParams) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragFraction, setDragFraction] = React.useState(0);

  const fractionFromPointer = React.useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clampFraction((clientX - rect.left) / rect.width);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragFraction(fractionFromPointer(event.clientX));
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragFraction(fractionFromPointer(event.clientX));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!isDragging || !duration) return;
    setIsDragging(false);
    seek(fractionFromPointer(event.clientX) * duration);
  };

  const handlePointerCancel = () => setIsDragging(false);

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

  return {
    containerRef,
    isDragging,
    dragFraction,
    fractionFromPointer,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
