/* eslint-disable @next/next/no-img-element -- Player artwork receives dynamic CDN hosts. */
"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ChevronDown,
  Music2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { TrackInfo } from "@/shared/types/dataType";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { IconToggleButton } from "@/shared/components/iconToggleButton";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import { formatTime } from "@/shared/lib/util";

type MobileFullscreenPlayerProps = {
  currentTrackInfo: TrackInfo | null;
  currentProgress: number;
  duration: number;
  seek: (time: number) => void;
  onClose: () => void;
};

export default function MobileFullscreenPlayer({
  currentTrackInfo,
  currentProgress,
  duration,
  seek,
  onClose,
}: MobileFullscreenPlayerProps) {
  const { isPlaying, togglePlayPause, prevTrack, nextTrack } = useAudioPlayer();
  const { isShuffleEnabled, toggleShuffle, currentTime } = useAudioPlayer();
  const seekBarRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const hasPlayableTrack = Boolean(currentTrackInfo?.url);
  const artworkSrc = currentTrackInfo?.artworkId?.trim() ?? "";

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !duration) return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const seekFraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seek(seekFraction * duration);
  };

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
      className="fixed inset-0 z-[90] flex flex-col bg-[linear-gradient(180deg,#2c1720_0%,#0b070b_52%,#050305_100%)] text-white md:hidden"
      style={{
        opacity: isClosing ? 0 : Math.max(0.72, 1 - dragY / 720),
        transform: `translateY(${isClosing ? "100%" : `${dragY}px`})`,
        transition: isDragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
      }}
    >
      <button
        type="button"
        className="flex min-h-14 w-full touch-none items-center justify-center px-5 text-white/86 transition-colors hover:text-white"
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

      <div className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-[calc(28px+max(env(safe-area-inset-bottom),12px))]">
        <div className="mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-lg bg-white/10 shadow-[0_34px_90px_rgba(0,0,0,0.5)]">
          {artworkSrc && currentTrackInfo ? (
            <img
              src={artworkSrc}
              alt={currentTrackInfo.album}
              width={300}
              height={300}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#fd6d94]">
              <Music2 size={56} strokeWidth={1.8} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-8 min-w-0">
          <h2 className="truncate text-2xl font-black tracking-tight text-white">
            {currentTrackInfo?.name ?? "No track selected"}
          </h2>
          <p className="mt-1 truncate text-base font-semibold text-white/62">
            {currentTrackInfo?.producer ?? "Choose a song to start playback"}
          </p>
        </div>

        <div
          ref={seekBarRef}
          className="mt-7 h-7 cursor-pointer py-3"
          onClick={handleSeek}
          aria-label="Track progress"
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-white/22">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-150 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-semibold tabular-nums text-white/54">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <section
          className="mt-4 flex items-center justify-center gap-5"
          aria-label={`${currentTrackInfo?.name ?? "Current track"} fullscreen controls`}
        >
          <PlayerControlButton
            id="mobile-fullscreen-shuffle"
            onClick={toggleShuffle}
            aria-label={
              isShuffleEnabled ? "Disable shuffle playback" : "Enable shuffle playback"
            }
            title={isShuffleEnabled ? "Shuffle on" : "Shuffle off"}
            className={`h-11 w-11 ${
              isShuffleEnabled ? "text-[#ff98a2]" : "text-white/58 hover:text-white"
            }`}
            disabled={!hasPlayableTrack}
          >
            <Shuffle className="m-auto block" size={22} fill="currentColor" aria-hidden="true" />
          </PlayerControlButton>
          <PlayerControlButton
            id="mobile-fullscreen-previous"
            onClick={prevTrack}
            aria-label="Previous track"
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
            className="bg-white text-black hover:bg-[#ffd6e1]"
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
