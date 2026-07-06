export const ERROR_CLASSES = {
  catalogFetchFailed: "catalog_fetch_failed",
  searchFallbackUsed: "search_fallback_used",
  selectedTrackUnavailable: "selected_track_unavailable",
  trackPlaybackFailed: "track_playback_failed",
  autoplayBlocked: "autoplay_blocked",
  indexedDbUnavailable: "indexeddb_unavailable",
  artworkLoadFailed: "artwork_load_failed",
  routeRenderFailed: "route_render_failed",
  unexpectedClientError: "unexpected_client_error",
} as const;

export type ErrorClass = (typeof ERROR_CLASSES)[keyof typeof ERROR_CLASSES];
export type ErrorSeverity = "fatal" | "error" | "warning" | "info";

export const ERROR_SEVERITY_BY_CLASS = {
  [ERROR_CLASSES.catalogFetchFailed]: "warning",
  [ERROR_CLASSES.searchFallbackUsed]: "warning",
  [ERROR_CLASSES.selectedTrackUnavailable]: "info",
  [ERROR_CLASSES.trackPlaybackFailed]: "error",
  [ERROR_CLASSES.autoplayBlocked]: "info",
  [ERROR_CLASSES.indexedDbUnavailable]: "warning",
  [ERROR_CLASSES.artworkLoadFailed]: "info",
  [ERROR_CLASSES.routeRenderFailed]: "fatal",
  [ERROR_CLASSES.unexpectedClientError]: "error",
} satisfies Record<ErrorClass, ErrorSeverity>;

export type SafeErrorTagInput = {
  error_class: ErrorClass;
  operation?: string;
  resource_type?: string;
  retryable?: boolean;
  route?: string;
  runtime?: string;
  track_id?: string;
  track_source?: string;
  view?: string;
};

export type SafeSentryContextValue = string | number | boolean | null;

export const getErrorSeverity = (errorClass: ErrorClass): ErrorSeverity =>
  ERROR_SEVERITY_BY_CLASS[errorClass];

export const buildErrorTags = (
  input: SafeErrorTagInput,
): Record<string, string | number | boolean> => {
  const tags: Record<string, string | number | boolean> = {};

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      tags[key] = value;
    }
  });

  return tags;
};

export const buildSafeContext = <
  TContext extends Record<string, SafeSentryContextValue | undefined>,
>(
  context: TContext,
): Record<string, SafeSentryContextValue> => {
  const safeContext: Record<string, SafeSentryContextValue> = {};

  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined) {
      safeContext[key] = value;
    }
  });

  return safeContext;
};
