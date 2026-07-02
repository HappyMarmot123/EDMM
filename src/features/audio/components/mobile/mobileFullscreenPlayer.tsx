"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { shouldUnoptimizeArtworkImage } from "@/features/audio/components/artworkImage";
import type { Track } from "@/entities/track";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { IconToggleButton } from "@/shared/components/iconToggleButton";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import MSeekBar from "@/features/audio/components/mobile/mSeekBar";
import MFullscreenBackdrop from "@/features/audio/components/mobile/mFullscreenBackdrop";
import { useAlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";

type MobileFullscreenPlayerProps = {
  currentTrackInfo: Track | null;
  duration: number;
  seek: (time: number) => void;
  onClose: () => void;
};

// 데스크톱 풀스크린과 동일한 전환 정책: 아트워크는 스냅 아웃 후 빠른 페이드 인,
// backdrop(저주파)은 느린 크로스페이드.
const ARTWORK_FADE_MS = 280;
const BACKDROP_FADE_MS = 450;

const fadeStyle = (opacity: number, durationMs: number): CSSProperties => ({
  opacity,
  transition: `opacity ${durationMs}ms ease-out`,
});

export default function MobileFullscreenPlayer({
  currentTrackInfo,
  duration,
  seek,
  onClose,
}: MobileFullscreenPlayerProps) {
  const { isPlaying, togglePlayPause, prevTrack, nextTrack, currentTime } =
    useAudioPlayer();
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const hasPlayableTrack = Boolean(currentTrackInfo?.streamUrl);
  const artworkSrc = currentTrackInfo?.artworkUrl?.trim() ?? "";
  const { palette, resolvedSrc } = useAlbumColorPalette(artworkSrc);
  const { layers, completeLayer } = useArtworkCrossfade({
    artworkSrc,
    palette,
    resolvedSrc,
    fadeDurationMs: BACKDROP_FADE_MS,
  });
  const topArtworkLayer = layers.length ? layers[layers.length - 1] : null;

  const closeWithSlide = () => {
    setIsClosing(true);
    window.setTimeout(onClose, 180);
  };

  const getSafeClientY = (event: PointerEvent<HTMLButtonElement>) =>
    Number.isFinite(event.clientY) ? event.clientY : dragStartYRef.current;

  const setPointerCaptureSafely = (event: PointerEvent<HTMLButtonElement>) => {
    if (typeof event.currentTarget.setPointerCapture !== "function") return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded browsers expose the API but reject capture for synthetic or inactive pointers.
    }
  };

  const releasePointerCaptureSafely = (event: PointerEvent<HTMLButtonElement>) => {
    if (typeof event.currentTarget.releasePointerCapture !== "function") return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be released after cancellation or viewport gesture interruption.
    }
  };

  const handleDragStart = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartYRef.current = Number.isFinite(event.clientY) ? event.clientY : 0;
    dragStartTimeRef.current = performance.now();
    setIsDragging(true);
    setPointerCaptureSafely(event);
  };

  const handleDragMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setDragY(Math.max(0, getSafeClientY(event) - dragStartYRef.current));
  };

  const handleDragEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const elapsedMs = Math.max(1, performance.now() - dragStartTimeRef.current);
    const velocity = dragY / elapsedMs;
    const shouldClose = dragY > 120 || (dragY > 48 && velocity > 0.8);

    setIsDragging(false);
    releasePointerCaptureSafely(event);

    if (shouldClose) {
      closeWithSlide();
      return;
    }

    setDragY(0);
  };

  const handleDragCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    setIsDragging(false);
    releasePointerCaptureSafely(event);
    setDragY(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile fullscreen player"
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#050305] text-white md:hidden"
      style={{
        opacity: isClosing ? 0 : Math.max(0.72, 1 - dragY / 720),
        transform: `translateY(${isClosing ? "100%" : `${dragY}px`})`,
        transition: isDragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
      }}
    >
      {/* 앨범 팔레트 연동 백드롭 — backdrop은 크로스페이드, 완료 판정도 여기(가장 느린 레이어) 기준 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {layers.map((layer) => (
          <div
            key={layer.key}
            className="absolute inset-0"
            style={fadeStyle(layer.opacity, BACKDROP_FADE_MS)}
            onTransitionEnd={(event) => {
              if (
                event.propertyName === "opacity" &&
                event.target === event.currentTarget
              ) {
                completeLayer(layer.key);
              }
            }}
          >
            <MFullscreenBackdrop
              artworkSrc={layer.artworkSrc}
              hasArtwork={layer.hasArtwork}
              palette={layer.palette}
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.48)_56%,rgba(0,0,0,0.8))]"
        />
      </div>

      <button
        type="button"
        className="relative z-[1] flex min-h-14 w-full touch-none items-center justify-center px-5 text-white/86 transition-colors hover:text-white"
        onClick={() => {
          if (dragY > 8) return;
          closeWithSlide();
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragCancel}
        aria-label="Close fullscreen player"
      >
        <ChevronDown size={28} strokeWidth={2.2} aria-hidden="true" />
      </button>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center px-6 pb-[calc(28px+max(env(safe-area-inset-bottom),12px))]">
        <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-lg bg-white/10 shadow-[0_34px_90px_rgba(0,0,0,0.5)]">
          {/* 스냅 아웃: top 레이어만 렌더 — key 교체로 이전 아트워크는 즉시 제거되고
              새 레이어만 짧게 페이드 인한다 (겹침 블렌딩 없음) */}
          {topArtworkLayer?.hasArtwork && currentTrackInfo ? (
            <div
              key={topArtworkLayer.key}
              className="absolute inset-0"
              style={fadeStyle(topArtworkLayer.opacity, ARTWORK_FADE_MS)}
            >
              <Image
                src={topArtworkLayer.artworkSrc}
                alt={currentTrackInfo.albumName ?? currentTrackInfo.source}
                fill
                sizes="300px"
                unoptimized={shouldUnoptimizeArtworkImage(topArtworkLayer.artworkSrc)}
                className="object-cover"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#fd6d94]">
              <Music2 size={56} strokeWidth={1.8} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-8 min-w-0">
          <h2 className="truncate text-2xl font-black tracking-tight text-white">
            {currentTrackInfo?.title ?? "No track selected"}
          </h2>
          <p className="mt-1 truncate text-base font-semibold text-white/62">
            {currentTrackInfo?.artistName ?? "Choose a song to start playback"}
          </p>
        </div>

        <div className="mt-6" aria-label="Track progress">
          <MSeekBar currentTime={currentTime} duration={duration} seek={seek} />
        </div>

        <section
          className="mt-4 flex items-center justify-center gap-6"
          aria-label={`${currentTrackInfo?.title ?? "Current track"} fullscreen controls`}
        >
          {/* shuffle은 모바일뷰에서 비활성화 (사용자 결정) — 전역 shuffle 상태 자체는 유지 */}
          <PlayerControlButton
            id="mobile-fullscreen-previous"
            onClick={prevTrack}
            aria-label="Previous track"
            pressFeedback
            className="h-12 w-12 text-white/78 hover:text-white"
            disabled={!hasPlayableTrack}
          >
            <SkipBack className="m-auto block" size={30} fill="currentColor" aria-hidden="true" />
          </PlayerControlButton>
          <IconToggleButton
            id="mobile-fullscreen-play-pause"
            condition={isPlaying}
            IconOnTrue={Pause}
            IconOnFalse={Play}
            onClick={togglePlayPause}
            label={isPlaying ? "Pause" : "Play"}
            hoverSurface={false}
            pressFeedback
            className="bg-white text-black"
            disabled={!hasPlayableTrack}
            iconProps={{
              width: 34,
              height: 34,
              fill: "currentColor",
              className: "text-black",
            }}
          />
          <PlayerControlButton
            id="mobile-fullscreen-next"
            onClick={nextTrack}
            aria-label="Next track"
            pressFeedback
            className="h-12 w-12 text-white/78 hover:text-white"
            disabled={!hasPlayableTrack}
          >
            <SkipForward className="m-auto block" size={30} fill="currentColor" aria-hidden="true" />
          </PlayerControlButton>
        </section>
      </div>
    </div>
  );
}
