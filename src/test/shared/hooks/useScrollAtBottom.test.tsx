import { act, renderHook } from "@testing-library/react";
import { useScrollAtBottom } from "@/shared/hooks/useScrollAtBottom";

const createScrollElement = ({
  scrollHeight,
  clientHeight,
  scrollTop = 0,
}: {
  scrollHeight: number;
  clientHeight: number;
  scrollTop?: number;
}) => {
  const element = document.createElement("div");
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
  element.scrollTop = scrollTop;
  return element;
};

describe("useScrollAtBottom", () => {
  it("returns true when no element is attached", () => {
    const { result } = renderHook(() => useScrollAtBottom(null));

    expect(result.current).toBe(true);
  });

  it("returns true when content fits without scrolling", () => {
    const element = createScrollElement({ scrollHeight: 300, clientHeight: 300 });
    const { result } = renderHook(() => useScrollAtBottom(element));

    expect(result.current).toBe(true);
  });

  it("returns false when scrollable content is not at the bottom", () => {
    const element = createScrollElement({ scrollHeight: 900, clientHeight: 300 });
    const { result } = renderHook(() => useScrollAtBottom(element));

    expect(result.current).toBe(false);
  });

  it("returns true after scrolling to the bottom", () => {
    const element = createScrollElement({ scrollHeight: 900, clientHeight: 300 });
    const { result } = renderHook(() => useScrollAtBottom(element));

    expect(result.current).toBe(false);

    act(() => {
      element.scrollTop = 600;
      element.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("returns false again when scrolling back up", () => {
    const element = createScrollElement({
      scrollHeight: 900,
      clientHeight: 300,
      scrollTop: 600,
    });
    const { result } = renderHook(() => useScrollAtBottom(element));

    expect(result.current).toBe(true);

    act(() => {
      element.scrollTop = 100;
      element.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });
});
