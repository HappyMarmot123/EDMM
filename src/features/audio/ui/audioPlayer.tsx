"use client";

import { useRef } from "react";
import PlayerTrackDetails from "@/features/audio/components/playerTrackDetails";
import PlayerControlsSection from "@/features/audio/components/playerControlsSection";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import { useToggle } from "@/shared/providers/toggleProvider";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

export default function AudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, seek } =
    useAudioPlayer();
  const { openToggle } = useToggle();
  const seekBarContainerRef = useRef<HTMLDivElement>(null);

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside
      id="player-container"
      className="fixed inset-x-0 bottom-0 z-[70] select-none border-t border-white/10 bg-[#080609]/95 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      aria-label="Audio Player"
    >
      <div
        id="player"
        className="mx-auto flex min-h-[96px] w-full max-w-[1440px] items-center gap-4 px-4 pt-3 sm:px-6 lg:px-8"
      >
        <AlbumArtwork
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTrackInfo={currentTrack}
          onClick={openToggle}
        />
        <div
          id="player-content"
          className="flex min-w-0 flex-1 flex-col justify-center gap-2"
        >
          <PlayerControlsSection currentTrackInfo={currentTrack} />
          <PlayerTrackDetails
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            currentProgress={currentProgress}
            seekBarContainerRef={seekBarContainerRef}
            seek={seek}
            currentTrackInfo={currentTrack}
          />
        </div>
      </div>
    </aside>
  );
}
