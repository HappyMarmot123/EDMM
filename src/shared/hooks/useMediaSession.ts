import { useEffect } from "react";
import type { Track } from "@/entities/track";

type MediaSessionState = {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  togglePlayPause: () => void | Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
};

const clampPositionState = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function useMediaSession({
  currentTrack,
  currentTime,
  duration,
  togglePlayPause,
  nextTrack,
  prevTrack,
  seekTo,
}: MediaSessionState) {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !currentTrack ||
      !("mediaSession" in navigator)
    ) {
      return;
    }

    const mediaSession = navigator.mediaSession;
    const artwork = currentTrack.artworkUrl
      ? [{ src: currentTrack.artworkUrl }]
      : undefined;
    const metadata = typeof MediaMetadata === "undefined" ? null : new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName,
      artwork,
    });

    mediaSession.metadata = metadata;

    const clampedDuration =
      Number.isFinite(duration) && duration > 0 ? duration : 0;

    if (clampedDuration > 0 && "setPositionState" in mediaSession) {
      mediaSession.setPositionState({
        duration: clampedDuration,
        position: currentTime > clampedDuration ? clampedDuration : currentTime,
        playbackRate: 1,
      });
    }

    mediaSession.setActionHandler("play", () => {
      void togglePlayPause();
    });

    mediaSession.setActionHandler("pause", () => {
      void togglePlayPause();
    });

    mediaSession.setActionHandler("nexttrack", nextTrack);
    mediaSession.setActionHandler("previoustrack", prevTrack);
    mediaSession.setActionHandler("seekto", (details) => {
      const nextTime = details?.seekTime;

      if (typeof nextTime === "number" && clampedDuration > 0) {
        seekTo(clampPositionState(Math.min(nextTime, clampedDuration)));
      }
    });

    return () => {
      mediaSession.setActionHandler("play", null);
      mediaSession.setActionHandler("pause", null);
      mediaSession.setActionHandler("nexttrack", null);
      mediaSession.setActionHandler("previoustrack", null);
      mediaSession.setActionHandler("seekto", null);
      mediaSession.metadata = null;
    };
  }, [
    currentTrack,
    duration,
    nextTrack,
    prevTrack,
    seekTo,
    togglePlayPause,
  ]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !currentTrack ||
      !("mediaSession" in navigator)
    ) {
      return;
    }

    const mediaSession = navigator.mediaSession;
    const clampedDuration =
      Number.isFinite(duration) && duration > 0 ? duration : 0;
    const clampedPosition = clampPositionState(
      currentTime > clampedDuration ? clampedDuration : currentTime,
    );

    if (clampedDuration > 0 && "setPositionState" in mediaSession) {
      mediaSession.setPositionState({
        duration: clampedDuration,
        position: clampedPosition,
        playbackRate: 1,
      });
    }
  }, [currentTrack, currentTime, duration]);
}
