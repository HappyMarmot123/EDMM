import { act, renderHook } from "@testing-library/react";
import { useOncePerSession } from "@/shared/hooks/useOncePerSession";

beforeEach(() => {
  window.sessionStorage.clear();
  jest.restoreAllMocks();
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

it("does not throw when sessionStorage read is blocked", () => {
  const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("sessionStorage read blocked");
    });

  const hook = renderHook(() => useOncePerSession("blocked-read"));

  expect(hook.result.current.shouldRun).toBe(true);

  getItem.mockRestore();
});

it("marks done in memory when sessionStorage write is blocked", () => {
  const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("sessionStorage write blocked");
    });

  const hook = renderHook(() => useOncePerSession("blocked-write"));

  act(() => {
    hook.result.current.markDone();
  });

  expect(hook.result.current.shouldRun).toBe(false);

  setItem.mockRestore();
});
