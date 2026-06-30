import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";

const createMediaQueryList = (matches: boolean) => {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;

  return {
    get listener() {
      return listener;
    },
    media: "(min-width: 768px)",
    matches,
    onchange: null,
    addEventListener: jest.fn((_event: string, nextListener) => {
      listener = nextListener as (event: MediaQueryListEvent) => void;
    }),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as unknown as MediaQueryList & {
    listener: ((event: MediaQueryListEvent) => void) | null;
  };
};

describe("useMediaQuery", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
  });

  it("keeps the default value when matchMedia is unavailable", () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)", true));

    expect(result.current).toBe(true);
  });

  it("subscribes to media query changes with modern listeners", () => {
    const mediaQueryList = createMediaQueryList(false);
    window.matchMedia = jest.fn(() => mediaQueryList);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)", false));

    expect(result.current).toBe(false);
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    act(() => {
      mediaQueryList.listener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });
});
