import * as Sentry from "@sentry/nextjs";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";

export type SearchFallbackEvent =
  | {
      type: "catalog_fetch_failed";
      route: "/search";
      view: MusicView;
      queryLength: number;
      hasQuery: boolean;
      hasStaleData: boolean;
    }
  | {
      type: "search_fallback_used";
      route: "/search";
      view: MusicView;
      queryLength: number;
      hasQuery: boolean;
      resultCount: number;
    }
  | {
      type: "indexeddb_unavailable";
      route: "/search";
      view: MusicView;
      operation: "recent_plays_read" | "track_cache_bulk_read";
    }
  | {
      type: "selected_track_unavailable";
      route: "/search";
      view: MusicView;
      hasTrackId: boolean;
    };

export function captureSearchFallbackEvent(event: SearchFallbackEvent): void {
  Sentry.captureMessage(`search.${event.type}`, {
    level: event.type === "selected_track_unavailable" ? "info" : "warning",
    tags: {
      error_class: event.type,
      route: event.route,
      view: event.view,
    },
    contexts: {
      search: event,
    },
  });
}
