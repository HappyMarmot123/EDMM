import { act, renderHook } from "@testing-library/react";
import { useAndroidAppPromo } from "@/shared/hooks/useAndroidAppPromo";
import { APP_PROMO_STORAGE_KEY } from "@/features/appPromo/config";

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

describe("useAndroidAppPromo", () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("shows on a fresh Android device", () => {
    setUserAgent(ANDROID_UA);
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(true);
  });

  it("does not show on iOS", () => {
    setUserAgent(IOS_UA);
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show on desktop", () => {
    setUserAgent(DESKTOP_UA);
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show when dismissedUntil is in the future", () => {
    setUserAgent(ANDROID_UA);
    window.localStorage.setItem(
      APP_PROMO_STORAGE_KEY,
      String(Date.now() + 60_000),
    );
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(false);
  });

  it("shows again when dismissedUntil is in the past", () => {
    setUserAgent(ANDROID_UA);
    window.localStorage.setItem(
      APP_PROMO_STORAGE_KEY,
      String(Date.now() - 60_000),
    );
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(true);
  });

  it("hides after dismiss and persists a future timestamp", () => {
    setUserAgent(ANDROID_UA);
    const { result } = renderHook(() => useAndroidAppPromo());
    expect(result.current.shouldShow).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.shouldShow).toBe(false);
    const stored = Number(window.localStorage.getItem(APP_PROMO_STORAGE_KEY));
    expect(stored).toBeGreaterThan(Date.now());
  });
});
