"use client";

import { useRef } from "react";
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

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      id="player-container-mobile"
      className="fixed bottom-0 left-0 w-full h-[80px] bg-white z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
      aria-label="Audio Player"
    >
      <section
        id="seek-bar-container-mobile"
        ref={seekBarContainerRef}
        className="absolute top-0 left-0 w-full h-[6px] cursor-pointer group"
      >
        <div className="w-full h-full bg-gray-200">
          <div
            id="seek-bar-mobile"
            className="h-full bg-[#fd6d94] transition-all duration-100 ease-linear"
            style={{ width: `${currentProgress}%` }}
          >
            <span className="absolute right-0 top-1/2 -mt-1 h-3 w-3 bg-white border-2 border-[#fd6d94] rounded-full opacity-0 group-hover:opacity-100"></span>
          </div>
        </div>
      </section>
      <div
        id="player-mobile"
        className="relative h-full flex items-center px-4 justify-between"
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
