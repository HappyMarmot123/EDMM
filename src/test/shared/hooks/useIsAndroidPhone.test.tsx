import { renderHook } from "@testing-library/react";
import { useIsAndroidPhone } from "@/shared/hooks/useIsAndroidPhone";
import { useViewport } from "@/shared/hooks/useViewport";

jest.mock("@/shared/hooks/useViewport");

const mockedUseViewport = useViewport as jest.MockedFunction<typeof useViewport>;

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

function viewport(overrides: { isMobile: boolean; isClient: boolean }) {
  return {
    viewport: { width: overrides.isMobile ? 400 : 1280, height: 800 },
    isMobile: overrides.isMobile,
    isTablet: false,
    isDesktop: !overrides.isMobile,
    isClient: overrides.isClient,
  };
}

describe("useIsAndroidPhone", () => {
  afterEach(() => jest.clearAllMocks());

  it("is true for an Android UA on a phone-width client", () => {
    setUserAgent(ANDROID_UA);
    mockedUseViewport.mockReturnValue(viewport({ isMobile: true, isClient: true }));
    const { result } = renderHook(() => useIsAndroidPhone());
    expect(result.current).toBe(true);
  });

  it("is false for an iOS UA on a phone-width client", () => {
    setUserAgent(IOS_UA);
    mockedUseViewport.mockReturnValue(viewport({ isMobile: true, isClient: true }));
    const { result } = renderHook(() => useIsAndroidPhone());
    expect(result.current).toBe(false);
  });

  it("is false for an Android UA on a non-phone width (tablet/desktop)", () => {
    setUserAgent(ANDROID_UA);
    mockedUseViewport.mockReturnValue(viewport({ isMobile: false, isClient: true }));
    const { result } = renderHook(() => useIsAndroidPhone());
    expect(result.current).toBe(false);
  });

  it("is false before hydration (isClient false)", () => {
    setUserAgent(ANDROID_UA);
    mockedUseViewport.mockReturnValue(viewport({ isMobile: true, isClient: false }));
    const { result } = renderHook(() => useIsAndroidPhone());
    expect(result.current).toBe(false);
  });
});
