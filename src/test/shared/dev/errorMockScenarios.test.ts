import * as Sentry from "@sentry/nextjs";
import {
  DEV_ERROR_MOCK_SCENARIOS,
  runDevErrorMockScenario,
} from "@/shared/dev/errorMockScenarios";
import { resetPlaybackErrorEventCounts } from "@/shared/lib/sentry/playbackEvents";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

const captureException = Sentry.captureException as jest.Mock;
const captureMessage = Sentry.captureMessage as jest.Mock;

describe("dev error mock scenarios", () => {
  beforeEach(() => {
    captureException.mockClear();
    captureMessage.mockClear();
    resetPlaybackErrorEventCounts();
  });

  it("defines stable scenario ids for the development remote", () => {
    expect(DEV_ERROR_MOCK_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "catalog_fetch_failed",
      "indexeddb_unavailable",
      "track_playback_failed",
      "autoplay_blocked",
      "unexpected_client_error",
      "route_render_failed",
    ]);
  });

  it("captures catalog failures through the sanitized search fallback event", () => {
    const result = runDevErrorMockScenario("catalog_fetch_failed");

    expect(captureMessage).toHaveBeenCalledWith(
      "search.catalog_fetch_failed",
      expect.objectContaining({
        level: "warning",
        tags: expect.objectContaining({
          error_class: "catalog_fetch_failed",
          route: "/search",
          view: "edm",
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "https://",
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "searchText",
    );
    expect(result).toEqual({
      message: "Search catalog failure captured through Sentry.",
      scenarioId: "catalog_fetch_failed",
      title: "Catalog mock triggered",
    });
  });

  it("captures playback source failures through the playback taxonomy", () => {
    const result = runDevErrorMockScenario("track_playback_failed");

    expect(captureMessage).toHaveBeenCalledWith(
      "playback.track_playback_failed",
      expect.objectContaining({
        level: "error",
        tags: expect.objectContaining({
          error_class: "track_playback_failed",
          retryable: true,
          route: "/search",
          runtime: "browser",
          track_id: "dev-error-remote-track",
          track_source: "cloudinary",
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(".mp3");
    expect(result).toEqual({
      message: "Playback source-load failure captured through Sentry.",
      scenarioId: "track_playback_failed",
      title: "Playback mock triggered",
    });
  });

  it("captures unexpected client errors without raw private context", () => {
    const result = runDevErrorMockScenario("unexpected_client_error");

    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "EDMM_DEV_REMOTE_UNEXPECTED_CLIENT_ERROR",
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          error_class: "unexpected_client_error",
          route: "/search",
          runtime: "browser",
        }),
      }),
    );
    expect(JSON.stringify(captureException.mock.calls[0])).not.toContain(
      "https://",
    );
    expect(result).toEqual({
      message: "Unexpected client exception captured through Sentry.",
      scenarioId: "unexpected_client_error",
      title: "Client mock triggered",
    });
  });
});
