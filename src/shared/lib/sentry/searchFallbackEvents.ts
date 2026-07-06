import * as Sentry from "@sentry/nextjs";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";
import {
  buildErrorTags,
  ERROR_CLASSES,
  getErrorSeverity,
} from "./errorTaxonomy";

export type SearchFallbackEvent =
  | {
      type: typeof ERROR_CLASSES.catalogFetchFailed;
      route: "/search";
      view: MusicView;
      queryLength: number;
      hasQuery: boolean;
      hasStaleData: boolean;
    }
  | {
      type: typeof ERROR_CLASSES.searchFallbackUsed;
      route: "/search";
      view: MusicView;
      queryLength: number;
      hasQuery: boolean;
      resultCount: number;
    }
  | {
      type: typeof ERROR_CLASSES.indexedDbUnavailable;
      route: "/search";
      view: MusicView;
      operation: "recent_plays_read" | "track_cache_bulk_read";
    }
  | {
      type: typeof ERROR_CLASSES.selectedTrackUnavailable;
      route: "/search";
      view: MusicView;
      hasTrackId: boolean;
    };

export function captureSearchFallbackEvent(event: SearchFallbackEvent): void {
  Sentry.captureMessage(`search.${event.type}`, {
    level: getErrorSeverity(event.type),
    tags: buildErrorTags({
      error_class: event.type,
      route: event.route,
      view: event.view,
      operation: "operation" in event ? event.operation : undefined,
    }),
    contexts: {
      search: event,
    },
  });
}
