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
import PlaybackErrorFeedback from "@/features/audio/components/playbackErrorFeedback";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useFadePresence } from "@/shared/hooks/useFadePresence";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import {
  addEdmmEventListener,
  dispatchEdmmEvent,
  EDMM_EVENTS,
} from "@/shared/lib/edmmEvents";
import type { Track } from "@/entities/track";

const FULLSCREEN_VIEWPORT_QUERY = "(min-width: 768px)";
const FULLSCREEN_EXIT_MS = 250;

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
    playbackError,
    togglePlayPause,
  } =
    useAudioPlayer();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenTrackOverride, setFullscreenTrackOverride] =
    useState<Track | null>(null);
  const canUseFullscreen = useCanUseFullscreenViewport();
  const fullscreenPresence = useFadePresence(
    isFullscreenOpen && canUseFullscreen,
    FULLSCREEN_EXIT_MS,
  );
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

  const previousCurrentTrackIdRef = useRef(currentTrackId);
  useEffect(() => {
    if (previousCurrentTrackIdRef.current === currentTrackId) {
      return;
    }
    previousCurrentTrackIdRef.current = currentTrackId;
    // Playback moved to a different track (prev/next, autoplay) while fullscreen
    // is open. Stop pinning to the previewed override track: otherwise the
    // fullscreen keeps showing the old artwork/palette and, because the shown
    // track no longer matches the playing one, the analyser is nulled and the
    // visualizer freezes. Following the current track re-syncs all three.
    setFullscreenTrackOverride(null);
  }, [currentTrackId]);

  useEffect(() => {
    const cleanup = addEdmmEventListener(
      window,
      EDMM_EVENTS.openPlayerFullscreen,
      (event) => {
      if (!canUseFullscreen) {
        return;
      }

      const nextTrack = event.detail.track ?? null;
      setFullscreenTrackOverride(nextTrack);
      setIsFullscreenOpen(true);
      },
    );

    return cleanup;
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
      dispatchEdmmEvent(window, EDMM_EVENTS.playerTrackZoneSelect, {
        trackId: currentTrackId,
      });
    }
  };

  return (
    <>
      {fullscreenPresence.mounted ? (
        <div
          data-testid="fullscreen-fade-layer"
          className={
            fullscreenPresence.visible
              ? "opacity-100 transition-opacity duration-300 ease-out"
              : "pointer-events-none opacity-0 transition-opacity duration-[250ms] ease-in"
          }
        >
          <DesktopFullscreenPlayer
            currentTrackInfo={fullscreenTrackInfo}
            analyser={isFullscreenTrackCurrent ? audioAnalyser : null}
            isPlaying={isFullscreenTrackCurrent && isPlaying}
            onClose={closeFullscreen}
          />
        </div>
      ) : null}

      <aside
        id="player-container"
        className="fixed inset-x-0 bottom-0 z-[70] select-none border-t border-white/10 bg-[#080609]/95 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        aria-label="Audio Player"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/[0.03] to-transparent"
        />
        <PlaybackErrorFeedback
          error={playbackError}
          canRetry={Boolean(currentTrack?.streamUrl)}
          onRetry={togglePlayPause}
        />
        <div
          id="player"
          className="mx-auto grid min-h-[96px] w-full max-w-6xl items-center gap-4 px-6 pt-3 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(164px,0.75fr)]"
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
              currentTime={currentTime}
              duration={duration}
              seek={seek}
              currentTrackInfo={currentTrack}
            />
          </section>
          <section
            data-testid="player-volume-zone"
            className="min-w-0 flex-shrink-0 justify-end flex-col items-end flex gap-2"
            aria-label="Volume zone"
          >
            <PlayerVolumeControls />
          </section>
        </div>
      </aside>
    </>
  );
}
