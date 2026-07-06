import * as Sentry from "@sentry/nextjs";
import {
  PLAYBACK_ERROR_CLASS_BY_CODE,
  PLAYBACK_ERROR_CODES,
  type PlaybackErrorCode,
} from "@/shared/providers/audioPlaybackErrors";
import {
  buildErrorTags,
  buildSafeContext,
  getErrorSeverity,
} from "./errorTaxonomy";

type PlaybackEventTrack = {
  id?: string | null;
  source?: string | null;
};

export type PlaybackErrorEvent = {
  errorCode: PlaybackErrorCode;
  retryable: boolean;
  route?: string;
  runtime?: "browser";
  track?: PlaybackEventTrack | null;
};

const playbackErrorEventCounts = new Map<string, number>();

const getSafeText = (value: string | null | undefined): string | undefined => {
  const text = value?.trim();
  return text && text.length > 0 ? text : undefined;
};

export const getCurrentBrowserRoute = (): string => {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return window.location.pathname || "/";
};

export const resetPlaybackErrorEventCounts = (): void => {
  playbackErrorEventCounts.clear();
};

export function capturePlaybackErrorEvent(event: PlaybackErrorEvent): void {
  const errorClass = PLAYBACK_ERROR_CLASS_BY_CODE[event.errorCode];
  const trackId = getSafeText(event.track?.id);
  const trackSource = getSafeText(event.track?.source);
  const route = getSafeText(event.route) ?? getCurrentBrowserRoute();
  const runtime = event.runtime ?? "browser";
  const eventKey = `${event.errorCode}:${trackId ?? "none"}`;
  const occurrence = (playbackErrorEventCounts.get(eventKey) ?? 0) + 1;

  playbackErrorEventCounts.set(eventKey, occurrence);

  if (
    event.errorCode === PLAYBACK_ERROR_CODES.autoplayBlocked &&
    occurrence < 2
  ) {
    return;
  }

  Sentry.captureMessage(`playback.${errorClass}`, {
    level: getErrorSeverity(errorClass),
    tags: buildErrorTags({
      error_class: errorClass,
      retryable: event.retryable,
      route,
      runtime,
      track_id: trackId,
      track_source: trackSource,
    }),
    contexts: {
      playback: buildSafeContext({
        errorCode: event.errorCode,
        occurrence,
        retryable: event.retryable,
        route,
        runtime,
        trackId: trackId ?? null,
        trackSource: trackSource ?? null,
      }),
    },
  });
}
