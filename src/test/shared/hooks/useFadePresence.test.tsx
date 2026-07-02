import { act, renderHook } from "@testing-library/react";
import { useFadePresence } from "@/shared/hooks/useFadePresence";

describe("useFadePresence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("mounts immediately and becomes visible after the paint delay", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: false } },
    );
    expect(result.current.mounted).toBe(false);

    rerender({ isOpen: true });
    expect(result.current.mounted).toBe(true);
    expect(result.current.visible).toBe(false);

    act(() => jest.advanceTimersByTime(25));
    expect(result.current.visible).toBe(true);
  });

  it("hides immediately and unmounts after exitMs", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: true } },
    );
    act(() => jest.advanceTimersByTime(25));

    rerender({ isOpen: false });
    expect(result.current.visible).toBe(false);
    expect(result.current.mounted).toBe(true);

    act(() => jest.advanceTimersByTime(250));
    expect(result.current.mounted).toBe(false);
  });

  it("cancels a pending unmount when reopened mid-exit", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: true } },
    );
    act(() => jest.advanceTimersByTime(25));

    rerender({ isOpen: false });
    act(() => jest.advanceTimersByTime(100));
    rerender({ isOpen: true });
    act(() => jest.advanceTimersByTime(300));

    expect(result.current.mounted).toBe(true);
    expect(result.current.visible).toBe(true);
  });

  it("skips fades when prefers-reduced-motion is set", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });
    expect(result.current.visible).toBe(true);

    rerender({ isOpen: false });
    act(() => jest.advanceTimersByTime(0));
    expect(result.current.mounted).toBe(false);
  });
});
