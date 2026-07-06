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

type TrackMetadataSnapshot = {
  trackId: string | null;
  title: string;
  artist: string;
  album: string;
};

type MediaSessionActionName = Parameters<
  MediaSession["setActionHandler"]
>[0];

const MEDIA_SESSION_ACTIONS = [
  "play",
  "pause",
  "nexttrack",
  "previoustrack",
  "seekto",
] as const satisfies readonly MediaSessionActionName[];

const clampPositionState = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const getMediaSession = () => {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator)
  ) {
    return null;
  }

  return navigator.mediaSession;
};

const getPlayableDuration = (duration: number) =>
  Number.isFinite(duration) && duration > 0 ? duration : 0;

const getTrackPosition = (currentTime: number, duration: number) =>
  clampPositionState(Math.min(currentTime, duration));

const getTrackMetadataSnapshot = (
  currentTrack: Track | null,
): TrackMetadataSnapshot => ({
  trackId: currentTrack?.id ?? null,
  title: currentTrack?.title ?? "",
  artist: currentTrack?.artistName ?? "",
  album: currentTrack?.albumName ?? "",
});

const createMediaMetadata = ({
  title,
  artist,
  album,
}: Omit<TrackMetadataSnapshot, "trackId">) =>
  typeof MediaMetadata === "undefined"
    ? null
    : new MediaMetadata({
        title,
        artist,
        album,
      });

const clearActionHandlers = (mediaSession: MediaSession) => {
  MEDIA_SESSION_ACTIONS.forEach((action) => {
    mediaSession.setActionHandler(action, null);
  });
};

function useMediaSessionMetadata(trackMetadata: TrackMetadataSnapshot) {
  const { trackId, title, artist, album } = trackMetadata;

  useEffect(() => {
    if (!trackId) {
      return;
    }

    const mediaSession = getMediaSession();

    if (!mediaSession) {
      return;
    }

    mediaSession.metadata = createMediaMetadata({ title, artist, album });

    return () => {
      mediaSession.metadata = null;
    };
  }, [album, artist, title, trackId]);
}

function useMediaSessionActionHandlers({
  trackId,
  duration,
  togglePlayPause,
  nextTrack,
  prevTrack,
  seekTo,
}: Pick<
  MediaSessionState,
  "duration" | "togglePlayPause" | "nextTrack" | "prevTrack" | "seekTo"
> & { trackId: string | null }) {
  useEffect(() => {
    if (!trackId) {
      return;
    }

    const mediaSession = getMediaSession();

    if (!mediaSession) {
      return;
    }

    const playableDuration = getPlayableDuration(duration);

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

      if (typeof nextTime === "number" && playableDuration > 0) {
        seekTo(getTrackPosition(nextTime, playableDuration));
      }
    });

    return () => {
      clearActionHandlers(mediaSession);
    };
  }, [
    duration,
    nextTrack,
    prevTrack,
    seekTo,
    togglePlayPause,
    trackId,
  ]);
}

function useMediaSessionPositionState({
  trackId,
  currentTime,
  duration,
}: Pick<MediaSessionState, "currentTime" | "duration"> & {
  trackId: string | null;
}) {
  useEffect(() => {
    if (!trackId) {
      return;
    }

    const mediaSession = getMediaSession();

    if (!mediaSession || !("setPositionState" in mediaSession)) {
      return;
    }

    const playableDuration = getPlayableDuration(duration);

    if (playableDuration <= 0) {
      return;
    }

    mediaSession.setPositionState({
      duration: playableDuration,
      position: getTrackPosition(currentTime, playableDuration),
      playbackRate: 1,
    });
  }, [currentTime, duration, trackId]);
}

export function useMediaSession({
  currentTrack,
  currentTime,
  duration,
  togglePlayPause,
  nextTrack,
  prevTrack,
  seekTo,
}: MediaSessionState) {
  const trackMetadata = getTrackMetadataSnapshot(currentTrack);

  useMediaSessionMetadata(trackMetadata);
  useMediaSessionActionHandlers({
    trackId: trackMetadata.trackId,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
  });
  useMediaSessionPositionState({
    trackId: trackMetadata.trackId,
    currentTime,
    duration,
  });
}
