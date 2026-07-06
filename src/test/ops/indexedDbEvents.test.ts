import * as Sentry from "@sentry/nextjs";
import { captureIndexedDbUnavailableEvent } from "@/shared/lib/sentry/indexedDbEvents";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const captureMessage = Sentry.captureMessage as jest.Mock;

describe("captureIndexedDbUnavailableEvent", () => {
  beforeEach(() => {
    captureMessage.mockClear();
  });

  it("captures IndexedDB failures with operation and safe track identity only", () => {
    captureIndexedDbUnavailableEvent({
      operation: "recent_plays_write",
      route: "/search",
      retryable: false,
      trackId: "cloudinary:track-1",
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "indexeddb.indexeddb_unavailable",
      expect.objectContaining({
        level: "warning",
        tags: expect.objectContaining({
          error_class: "indexeddb_unavailable",
          operation: "recent_plays_write",
          retryable: false,
          route: "/search",
          track_id: "cloudinary:track-1",
        }),
        contexts: expect.objectContaining({
          indexeddb: expect.objectContaining({
            operation: "recent_plays_write",
            retryable: false,
            route: "/search",
            runtime: "browser",
            trackId: "cloudinary:track-1",
          }),
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "https://",
    );
  });

  it("does not throw when Sentry capture fails", () => {
    captureMessage.mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });

    expect(() => {
      captureIndexedDbUnavailableEvent({
        operation: "track_cache_write",
        retryable: false,
        trackId: "track-1",
      });
    }).not.toThrow();
  });
});
