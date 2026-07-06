"use client";

import * as Sentry from "@sentry/nextjs";
import { PLAYBACK_ERROR_CODES } from "@/shared/providers/audioPlaybackErrors";
import {
  capturePlaybackErrorEvent,
  resetPlaybackErrorEventCounts,
} from "@/shared/lib/sentry/playbackEvents";
import { captureSearchFallbackEvent } from "@/shared/lib/sentry/searchFallbackEvents";
import {
  buildErrorTags,
  buildSafeContext,
  ERROR_CLASSES,
} from "@/shared/lib/sentry/errorTaxonomy";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";

type DevErrorMockScenario = {
  id:
    | typeof ERROR_CLASSES.catalogFetchFailed
    | typeof ERROR_CLASSES.indexedDbUnavailable
    | typeof ERROR_CLASSES.trackPlaybackFailed
    | typeof ERROR_CLASSES.autoplayBlocked
    | typeof ERROR_CLASSES.unexpectedClientError
    | typeof ERROR_CLASSES.routeRenderFailed;
  label: string;
  description: string;
};

export const DEV_ERROR_MOCK_SCENARIOS = [
  {
    id: ERROR_CLASSES.catalogFetchFailed,
    label: "Catalog",
    description: "Capture a mocked Cloudinary catalog fetch failure.",
  },
  {
    id: ERROR_CLASSES.indexedDbUnavailable,
    label: "IndexedDB",
    description: "Capture a mocked local track-cache read failure.",
  },
  {
    id: ERROR_CLASSES.trackPlaybackFailed,
    label: "Playback",
    description: "Capture a mocked audio source-load failure.",
  },
  {
    id: ERROR_CLASSES.autoplayBlocked,
    label: "Autoplay",
    description: "Capture a mocked repeated autoplay block.",
  },
  {
    id: ERROR_CLASSES.unexpectedClientError,
    label: "Client",
    description: "Capture a mocked unexpected client exception.",
  },
  {
    id: ERROR_CLASSES.routeRenderFailed,
    label: "Route",
    description: "Throw during render to exercise the route error boundary.",
  },
] as const satisfies readonly DevErrorMockScenario[];

export type DevErrorMockScenarioId =
  (typeof DEV_ERROR_MOCK_SCENARIOS)[number]["id"];

export type DevErrorMockResult = {
  scenarioId: DevErrorMockScenarioId;
  title: string;
  message: string;
};

const devErrorMockResults: Record<DevErrorMockScenarioId, DevErrorMockResult> =
  {
    [ERROR_CLASSES.catalogFetchFailed]: {
      scenarioId: ERROR_CLASSES.catalogFetchFailed,
      title: "Catalog mock triggered",
      message: "Search catalog failure captured through Sentry.",
    },
    [ERROR_CLASSES.indexedDbUnavailable]: {
      scenarioId: ERROR_CLASSES.indexedDbUnavailable,
      title: "IndexedDB mock triggered",
      message: "IndexedDB track-cache failure captured through Sentry.",
    },
    [ERROR_CLASSES.trackPlaybackFailed]: {
      scenarioId: ERROR_CLASSES.trackPlaybackFailed,
      title: "Playback mock triggered",
      message: "Playback source-load failure captured through Sentry.",
    },
    [ERROR_CLASSES.autoplayBlocked]: {
      scenarioId: ERROR_CLASSES.autoplayBlocked,
      title: "Autoplay mock triggered",
      message: "Repeated autoplay block captured through Sentry.",
    },
    [ERROR_CLASSES.unexpectedClientError]: {
      scenarioId: ERROR_CLASSES.unexpectedClientError,
      title: "Client mock triggered",
      message: "Unexpected client exception captured through Sentry.",
    },
    [ERROR_CLASSES.routeRenderFailed]: {
      scenarioId: ERROR_CLASSES.routeRenderFailed,
      title: "Route mock triggered",
      message: "Route render failure will be thrown during render.",
    },
  };

const mockRoute = "/search";
const mockView: MusicView = "edm";
const mockTrack = {
  id: "dev-error-remote-track",
  source: "cloudinary",
};

export function runDevErrorMockScenario(
  scenarioId: DevErrorMockScenarioId,
): DevErrorMockResult {
  switch (scenarioId) {
    case ERROR_CLASSES.catalogFetchFailed:
      captureSearchFallbackEvent({
        type: ERROR_CLASSES.catalogFetchFailed,
        route: mockRoute,
        view: mockView,
        queryLength: 0,
        hasQuery: false,
        hasStaleData: false,
      });
      return devErrorMockResults[scenarioId];

    case ERROR_CLASSES.indexedDbUnavailable:
      captureSearchFallbackEvent({
        type: ERROR_CLASSES.indexedDbUnavailable,
        route: mockRoute,
        view: mockView,
        operation: "track_cache_bulk_read",
      });
      return devErrorMockResults[scenarioId];

    case ERROR_CLASSES.trackPlaybackFailed:
      capturePlaybackErrorEvent({
        errorCode: PLAYBACK_ERROR_CODES.sourceLoadFailed,
        retryable: true,
        route: mockRoute,
        runtime: "browser",
        track: mockTrack,
      });
      return devErrorMockResults[scenarioId];

    case ERROR_CLASSES.autoplayBlocked:
      resetPlaybackErrorEventCounts();
      capturePlaybackErrorEvent({
        errorCode: PLAYBACK_ERROR_CODES.autoplayBlocked,
        retryable: true,
        route: mockRoute,
        runtime: "browser",
        track: mockTrack,
      });
      capturePlaybackErrorEvent({
        errorCode: PLAYBACK_ERROR_CODES.autoplayBlocked,
        retryable: true,
        route: mockRoute,
        runtime: "browser",
        track: mockTrack,
      });
      return devErrorMockResults[scenarioId];

    case ERROR_CLASSES.unexpectedClientError:
      Sentry.captureException(
        new Error("EDMM_DEV_REMOTE_UNEXPECTED_CLIENT_ERROR"),
        {
          tags: buildErrorTags({
            error_class: ERROR_CLASSES.unexpectedClientError,
            route: mockRoute,
            runtime: "browser",
          }),
          contexts: {
            dev_error_mock: buildSafeContext({
              scenario: scenarioId,
              route: mockRoute,
              runtime: "browser",
            }),
          },
        },
      );
      return devErrorMockResults[scenarioId];

    case ERROR_CLASSES.routeRenderFailed:
      return devErrorMockResults[scenarioId];
  }
}
