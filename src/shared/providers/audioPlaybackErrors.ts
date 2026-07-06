import {
  ERROR_CLASSES,
  type ErrorClass,
} from "@/shared/lib/sentry/errorTaxonomy";

export const PLAYBACK_ERROR_CODES = {
  autoplayBlocked: "autoplay-blocked",
  sourceLoadFailed: "source-load-failed",
  unsupportedAudioContext: "unsupported-audio-context",
} as const;

export type PlaybackErrorCode =
  (typeof PLAYBACK_ERROR_CODES)[keyof typeof PLAYBACK_ERROR_CODES];

export const PLAYBACK_ERROR_CLASS_BY_CODE = {
  [PLAYBACK_ERROR_CODES.autoplayBlocked]: ERROR_CLASSES.autoplayBlocked,
  [PLAYBACK_ERROR_CODES.sourceLoadFailed]: ERROR_CLASSES.trackPlaybackFailed,
  [PLAYBACK_ERROR_CODES.unsupportedAudioContext]:
    ERROR_CLASSES.trackPlaybackFailed,
} satisfies Record<PlaybackErrorCode, ErrorClass>;

export const classifyPlaybackError = (
  error: unknown,
  fallback: PlaybackErrorCode,
): PlaybackErrorCode => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return PLAYBACK_ERROR_CODES.autoplayBlocked;
    }
    if (error.name === "NotSupportedError") {
      return PLAYBACK_ERROR_CODES.sourceLoadFailed;
    }
  }

  return fallback;
};

export const isPlaybackErrorRetryable = (
  errorCode: PlaybackErrorCode,
): boolean => errorCode !== PLAYBACK_ERROR_CODES.sourceLoadFailed;
