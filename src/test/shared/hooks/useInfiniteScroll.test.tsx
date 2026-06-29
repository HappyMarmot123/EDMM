import { render, screen } from "@testing-library/react";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";

function InfiniteScrollHarness({ onIntersect }: { onIntersect: () => void }) {
  const { targetRef } = useInfiniteScroll({ onIntersect });

  return <div ref={targetRef} data-testid="infinite-scroll-target" />;
}

it("renders a target ref without auto-loading when IntersectionObserver is unavailable", () => {
  const originalObserver = global.IntersectionObserver;
  Object.defineProperty(global, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  const onIntersect = jest.fn();

  try {
    render(<InfiniteScrollHarness onIntersect={onIntersect} />);

    expect(screen.getByTestId("infinite-scroll-target")).toBeInTheDocument();
    expect(onIntersect).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(global, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: originalObserver,
    });
  }
});
