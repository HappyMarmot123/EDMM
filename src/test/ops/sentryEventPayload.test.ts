import {
  getCurrentBrowserRoute,
  getSafeText,
  resolveBrowserEventFields,
} from "@/shared/lib/sentry/eventPayload";

describe("sentry event payload helpers", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/search");
  });

  it("trims safe text and drops blank values", () => {
    expect(getSafeText(" track-1 ")).toBe("track-1");
    expect(getSafeText("   ")).toBeUndefined();
    expect(getSafeText(null)).toBeUndefined();
    expect(getSafeText(undefined)).toBeUndefined();
  });

  it("reads the current browser route", () => {
    expect(getCurrentBrowserRoute()).toBe("/search");
  });

  it("resolves route and runtime defaults without changing provided values", () => {
    expect(
      resolveBrowserEventFields({ route: " /player ", runtime: "browser" }),
    ).toEqual({
      route: "/player",
      runtime: "browser",
    });

    expect(resolveBrowserEventFields({})).toEqual({
      route: "/search",
      runtime: "browser",
    });
  });
});

