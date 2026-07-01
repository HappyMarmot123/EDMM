import type { PlaybackError } from "./audioPlayerTypes";

export const classifyPlaybackError = (
  error: unknown,
  fallback: NonNullable<PlaybackError>,
): NonNullable<PlaybackError> => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "autoplay-blocked";
    }
    if (error.name === "NotSupportedError") {
      return "source-load-failed";
    }
  }

  return fallback;
};
