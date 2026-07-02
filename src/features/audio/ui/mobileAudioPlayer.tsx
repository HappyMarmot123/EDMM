"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import MPlayerTrackDetails from "@/features/audio/components/mobile/m_playerTrackDetails";
import MPlayerControlsSection from "@/features/audio/components/mobile/m_playerControlsSection";
import MAlbumArtwork from "@/features/audio/components/mobile/m_albumArtwork";
import MobileFullscreenPlayer from "@/features/audio/components/mobile/mobileFullscreenPlayer";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

// Root here
export default function MobileAudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, seek } =
    useAudioPlayer();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const seekBarContainerRef = useRef<HTMLDivElement>(null);

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const openFullscreen = () => {
    if (currentTrack) {
      setIsFullscreenOpen(true);
    }
  };

  const handlePlayerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openFullscreen();
  };

  return (
    <>
      {isFullscreenOpen ? (
        <MobileFullscreenPlayer
          currentTrackInfo={currentTrack}
          duration={duration}
          seek={seek}
          onClose={() => setIsFullscreenOpen(false)}
        />
      ) : null}

      <div
        id="player-container-mobile"
        className="fixed inset-x-3 z-[70] rounded-lg bg-[#2b111c] text-white shadow-[0_16px_42px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
        style={{ bottom: "max(env(safe-area-inset-bottom), 10px)" }}
        aria-label="Audio Player"
      >
        <div
          id="player-mobile"
          className="relative min-h-[64px] overflow-hidden rounded-lg"
          role="button"
          tabIndex={currentTrack ? 0 : -1}
          onClick={openFullscreen}
          onKeyDown={handlePlayerKeyDown}
          aria-label={currentTrack ? "Open fullscreen player" : "No track selected"}
        >
          <div
            id="seek-bar-container-mobile"
            ref={seekBarContainerRef}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
            aria-label="Track progress"
          >
            <div className="h-full w-full bg-white/20">
              <div
                id="seek-bar-mobile"
                className="h-full bg-[#fd6d94] transition-[width] duration-150 ease-out"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
          <div className="flex min-h-[64px] items-center justify-between px-2.5 pb-1">
            <div
              className="flex min-w-0 flex-1 items-center"
              aria-label="Mobile track summary"
            >
              <MAlbumArtwork
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                currentTrackInfo={currentTrack}
              />
              <MPlayerTrackDetails
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                currentProgress={currentProgress}
                seekBarContainerRef={seekBarContainerRef}
                seek={seek}
                currentTrackInfo={currentTrack}
              />
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <MPlayerControlsSection currentTrackInfo={currentTrack} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
