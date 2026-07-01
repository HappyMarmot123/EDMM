"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import DesktopFullscreenPlayer from "@/features/audio/components/desktopFullscreenPlayer";
import PlayerTrackDetails, {
  PlayerTrackSummary,
} from "@/features/audio/components/playerTrackDetails";
import PlayerControlsSection, {
  PlayerVolumeControls,
} from "@/features/audio/components/playerControlsSection";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import type { Track } from "@/entities/track/model";

const FULLSCREEN_VIEWPORT_QUERY = "(min-width: 768px)";

function useCanUseFullscreenViewport() {
  return useMediaQuery(FULLSCREEN_VIEWPORT_QUERY, false);
}

export default function AudioPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    seek,
    audioAnalyser,
  } =
    useAudioPlayer();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenTrackOverride, setFullscreenTrackOverride] =
    useState<Track | null>(null);
  const canUseFullscreen = useCanUseFullscreenViewport();
  const seekBarContainerRef = useRef<HTMLDivElement>(null);
  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentTrackId = currentTrack?.id;
  const fullscreenTrackInfo = fullscreenTrackOverride ?? currentTrack;
  const isFullscreenTrackCurrent =
    !fullscreenTrackOverride || fullscreenTrackOverride.id === currentTrackId;

  const toggleFullscreen = useCallback(() => {
    if (canUseFullscreen) {
      setFullscreenTrackOverride(null);
      setIsFullscreenOpen((isOpen) => !isOpen);
    }
  }, [canUseFullscreen]);
  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    setFullscreenTrackOverride(null);
  }, []);

  useEffect(() => {
    if (!canUseFullscreen) {
      setIsFullscreenOpen(false);
      setFullscreenTrackOverride(null);
    }
  }, [canUseFullscreen]);

  useEffect(() => {
    const handleOpenPlayerFullscreen = (event: Event) => {
      if (!canUseFullscreen) {
        return;
      }

      const nextTrack =
        (event as CustomEvent<{ track?: Track }>).detail?.track ?? null;
      setFullscreenTrackOverride(nextTrack);
      setIsFullscreenOpen(true);
    };

    window.addEventListener(
      "edmm:open-player-fullscreen",
      handleOpenPlayerFullscreen,
    );

    return () => {
      window.removeEventListener(
        "edmm:open-player-fullscreen",
        handleOpenPlayerFullscreen,
      );
    };
  }, [canUseFullscreen]);

  const handleTrackZoneClick = () => {
    if (!currentTrackId) {
      return;
    }

    const isSearchRoute = pathname === "/search";
    const nextSearchParams = isSearchRoute
      ? new URLSearchParams(searchParams?.toString())
      : new URLSearchParams();

    nextSearchParams.set("track", currentTrackId);
    const queryString = nextSearchParams.toString();
    const nextPath = `/search${queryString ? `?${queryString}` : ""}`;

    router.replace(nextPath, { scroll: false });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("edmm:player-track-zone-select", {
          detail: { trackId: currentTrackId },
        }),
      );
    }
  };

  return (
    <>
      {isFullscreenOpen && canUseFullscreen ? (
        <DesktopFullscreenPlayer
          currentTrackInfo={fullscreenTrackInfo}
          analyser={isFullscreenTrackCurrent ? audioAnalyser : null}
          isPlaying={isFullscreenTrackCurrent && isPlaying}
          onClose={closeFullscreen}
        />
      ) : null}

      <aside
        id="player-container"
        className="fixed inset-x-0 bottom-0 z-[70] select-none border-t border-white/10 bg-[#080609]/95 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        aria-label="Audio Player"
      >
        <div
          id="player"
          className="mx-auto grid min-h-[96px] w-full max-w-[1440px] items-center gap-4 px-6 pt-3 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(164px,0.75fr)]"
        >
          <section
            data-testid="player-track-zone"
            className="flex min-w-0 cursor-pointer items-center gap-3"
            aria-label="Current track"
            onClick={handleTrackZoneClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              handleTrackZoneClick();
            }}
          >
            <AlbumArtwork
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              currentTrackInfo={currentTrack}
            />
            <PlayerTrackSummary currentTrackInfo={currentTrack} />
          </section>
          <section
            data-testid="player-control-zone"
            className="flex min-w-0 flex-col justify-center gap-2"
            aria-label="Playback and progress"
          >
            <PlayerControlsSection
              currentTrackInfo={currentTrack}
              onFullscreenOpen={toggleFullscreen}
              canOpenFullscreen={canUseFullscreen}
              isFullscreenOpen={isFullscreenOpen}
            />
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
            className="min-w-0 flex-shrink-0 justify-end flex"
            aria-label="Volume zone"
          >
            <PlayerVolumeControls />
          </section>
        </div>
      </aside>
    </>
  );
}
