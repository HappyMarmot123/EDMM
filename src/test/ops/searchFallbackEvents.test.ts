import * as Sentry from "@sentry/nextjs";
import { captureSearchFallbackEvent } from "@/shared/lib/sentry/searchFallbackEvents";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const captureMessage = Sentry.captureMessage as jest.Mock;

describe("captureSearchFallbackEvent", () => {
  beforeEach(() => {
    captureMessage.mockClear();
  });

  it("captures catalog fetch failure without raw query text", () => {
    captureSearchFallbackEvent({
      type: "catalog_fetch_failed",
      route: "/search",
      view: "edm",
      queryLength: 13,
      hasQuery: true,
      hasStaleData: true,
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "search.catalog_fetch_failed",
      expect.objectContaining({
        level: "warning",
        tags: expect.objectContaining({
          error_class: "catalog_fetch_failed",
          route: "/search",
          view: "edm",
        }),
        contexts: expect.objectContaining({
          search: expect.objectContaining({
            queryLength: 13,
            hasQuery: true,
            hasStaleData: true,
          }),
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "missing track",
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "https://",
    );
  });

  it("captures selected track unavailable with only hasTrackId", () => {
    captureSearchFallbackEvent({
      type: "selected_track_unavailable",
      route: "/search",
      view: "edm",
      hasTrackId: true,
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "search.selected_track_unavailable",
      expect.objectContaining({
        level: "info",
        tags: expect.objectContaining({
          error_class: "selected_track_unavailable",
          route: "/search",
          view: "edm",
        }),
        contexts: expect.objectContaining({
          search: expect.objectContaining({
            hasTrackId: true,
          }),
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "cloudinary:missing-track",
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "https://",
    );
  });
});
