"use client";

import { useRef, type MouseEvent } from "react";
import MPlayerTrackDetails from "@/features/audio/components/mobile/m_playerTrackDetails";
import MPlayerControlsSection from "@/features/audio/components/mobile/m_playerControlsSection";
import MAlbumArtwork from "@/features/audio/components/mobile/m_albumArtwork";
import { useToggle } from "@/shared/providers/toggleProvider";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

// Root here
export default function MobileAudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, seek } =
    useAudioPlayer();
  const { openToggle } = useToggle();
  const seekBarContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekInteraction = (event: MouseEvent<HTMLElement>) => {
    if (!seekBarContainerRef.current || !duration) return;

    const rect = seekBarContainerRef.current.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const seekFraction = clickPosition / rect.width;
    seek(seekFraction * duration);
  };

  return (
    <div
      id="player-container-mobile"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#080609]/95 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
      aria-label="Audio Player"
    >
      <section
        id="seek-bar-container-mobile"
        ref={seekBarContainerRef}
        className="group absolute left-0 top-0 h-1.5 w-full cursor-pointer"
        onClick={handleSeekInteraction}
      >
        <div className="h-full w-full bg-white/15">
          <div
            id="seek-bar-mobile"
            className="h-full bg-[#fd6d94] transition-[width] duration-150 ease-out"
            style={{ width: `${currentProgress}%` }}
          >
            <span className="absolute right-0 top-1/2 -mt-1.5 h-3 w-3 rounded-full border-2 border-[#fd6d94] bg-white opacity-0 group-hover:opacity-100"></span>
          </div>
        </div>
      </section>
      <div
        id="player-mobile"
        className="relative flex min-h-[78px] items-center justify-between px-4 pt-2"
      >
        <div className="flex items-center flex-1 min-w-0">
          <MAlbumArtwork
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            currentTrackInfo={currentTrack}
            onClick={() => {
              if (!isDragging.current) {
                openToggle();
              }
            }}
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
        <MPlayerControlsSection currentTrackInfo={currentTrack} />
      </div>
    </div>
  );
}
