"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import PlayerTrackDetails, {
  PlayerTrackSummary,
} from "@/features/audio/components/playerTrackDetails";
import PlayerControlsSection, {
  PlayerVolumeControls,
} from "@/features/audio/components/playerControlsSection";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

export default function AudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, seek } =
    useAudioPlayer();
  const router = useRouter();
  const seekBarContainerRef = useRef<HTMLDivElement>(null);

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const openTrackDetail = () => {
    if (!currentTrack) return;
    router.push(`/track/${encodeURIComponent(currentTrack.assetId)}`);
  };

  return (
    <aside
      id="player-container"
      className="fixed inset-x-0 bottom-0 z-[70] select-none border-t border-white/10 bg-[#080609]/95 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      aria-label="Audio Player"
    >
      <div
        id="player"
        className="mx-auto grid min-h-[96px] w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 px-4 pt-3 sm:px-6 md:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.75fr)] lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <section
          data-testid="player-track-zone"
          className="flex min-w-0 items-center gap-3"
          aria-label="Current track"
        >
          <AlbumArtwork
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            currentTrackInfo={currentTrack}
            onClick={openTrackDetail}
          />
          <PlayerTrackSummary currentTrackInfo={currentTrack} />
        </section>
        <section
          data-testid="player-control-zone"
          className="flex min-w-0 flex-col justify-center gap-2"
          aria-label="Playback and progress"
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
        </section>
        <section
          data-testid="player-volume-zone"
          className="hidden min-w-0 justify-end lg:flex"
          aria-label="Volume zone"
        >
          <PlayerVolumeControls />
        </section>
      </div>
    </aside>
  );
}
