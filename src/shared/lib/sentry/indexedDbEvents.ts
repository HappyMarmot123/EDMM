import * as Sentry from "@sentry/nextjs";
import {
  buildErrorTags,
  buildSafeContext,
  ERROR_CLASSES,
  getErrorSeverity,
} from "./errorTaxonomy";

export const INDEXEDDB_OPERATIONS = {
  recentPlaysWrite: "recent_plays_write",
  trackCacheWrite: "track_cache_write",
} as const;

export type IndexedDbOperation =
  (typeof INDEXEDDB_OPERATIONS)[keyof typeof INDEXEDDB_OPERATIONS];

export type IndexedDbUnavailableEvent = {
  operation: IndexedDbOperation;
  retryable: boolean;
  route?: string;
  runtime?: "browser";
  trackId?: string | null;
};

const getSafeText = (value: string | null | undefined): string | undefined => {
  const text = value?.trim();
  return text && text.length > 0 ? text : undefined;
};

const getCurrentBrowserRoute = (): string => {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return window.location.pathname || "/";
};

export function captureIndexedDbUnavailableEvent(
  event: IndexedDbUnavailableEvent,
): void {
  const route = getSafeText(event.route) ?? getCurrentBrowserRoute();
  const runtime = event.runtime ?? "browser";
  const trackId = getSafeText(event.trackId);

  try {
    Sentry.captureMessage(`indexeddb.${ERROR_CLASSES.indexedDbUnavailable}`, {
      level: getErrorSeverity(ERROR_CLASSES.indexedDbUnavailable),
      tags: buildErrorTags({
        error_class: ERROR_CLASSES.indexedDbUnavailable,
        operation: event.operation,
        retryable: event.retryable,
        route,
        runtime,
        track_id: trackId,
      }),
      contexts: {
        indexeddb: buildSafeContext({
          operation: event.operation,
          retryable: event.retryable,
          route,
          runtime,
          trackId: trackId ?? null,
        }),
      },
    });
  } catch {
    // Observability must not make IndexedDB fallback paths blocking.
  }
}
