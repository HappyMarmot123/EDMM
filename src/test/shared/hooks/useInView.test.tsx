import { renderHook } from "@testing-library/react";
import { useInView } from "@/shared/hooks/useInView";

it("returns a ref and starts outside the viewport", () => {
  const { result } = renderHook(() => useInView<HTMLDivElement>());

  expect(result.current.ref).toHaveProperty("current");
  expect(result.current.inView).toBe(false);
});
