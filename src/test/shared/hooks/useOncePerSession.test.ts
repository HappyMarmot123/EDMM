import { act, renderHook } from "@testing-library/react";
import { useOncePerSession } from "@/shared/hooks/useOncePerSession";

beforeEach(() => {
  window.sessionStorage.clear();
});

it("runs once until marked done in the current session", () => {
  const first = renderHook(() => useOncePerSession("intro"));

  expect(first.result.current.shouldRun).toBe(true);

  act(() => {
    first.result.current.markDone();
  });

  expect(first.result.current.shouldRun).toBe(false);

  const second = renderHook(() => useOncePerSession("intro"));
  expect(second.result.current.shouldRun).toBe(false);
});
