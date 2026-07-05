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
      view: "all",
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
          view: "all",
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
});
