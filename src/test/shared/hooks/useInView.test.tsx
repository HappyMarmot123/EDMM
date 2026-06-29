import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { useInView } from "@/shared/hooks/useInView";

it("returns a ref and starts outside the viewport", () => {
  const { result } = renderHook(() => useInView<HTMLDivElement>());

  expect(result.current.ref).toHaveProperty("current");
  expect(result.current.inView).toBe(false);
});

function InViewHarness() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} data-testid="target">
      {inView ? "visible" : "hidden"}
    </div>
  );
}

it("treats content as visible when IntersectionObserver is unavailable", async () => {
  const originalObserver = global.IntersectionObserver;
  Object.defineProperty(global, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });

  try {
    render(<InViewHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveTextContent("visible");
    });
  } finally {
    Object.defineProperty(global, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: originalObserver,
    });
  }
});
