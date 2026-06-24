import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

afterEach(() => {
  mockFetch.mockReset();
});

it("does not fetch when artist is missing", () => {
  const { result } = renderHook(() => useLyrics("", "Track"), {
    wrapper: createWrapper(),
  });

  expect(result.current.data).toBeUndefined();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("does not fetch when title is missing", () => {
  const { result } = renderHook(() => useLyrics("Artist", ""), {
    wrapper: createWrapper(),
  });

  expect(result.current.data).toBeUndefined();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("does not fetch when artist and title are whitespace only", () => {
  const { result } = renderHook(() => useLyrics("   ", "   "), {
    wrapper: createWrapper(),
  });

  expect(result.current.data).toBeUndefined();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("trims and fetches encoded lyrics then returns the lyrics text", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ lyrics: "hello from the hook" }),
  });

  const { result } = renderHook(() => useLyrics("  A&B  ", "  Song/Title  "), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/lyrics?artist=A%26B&title=Song%2FTitle",
  );
  expect(result.current.data).toBe("hello from the hook");
});

it("uses trimmed lyrics inputs as cache keys", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ lyrics: "cached lyric" }),
  });

  const wrapper = createWrapper();
  const first = renderHook(() => useLyrics("  Artist  ", "  Title  "), {
    wrapper,
  });

  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

  const second = renderHook(() => useLyrics("Artist", "Title"), { wrapper });

  await waitFor(() => expect(second.result.current.data).toBe("cached lyric"));

  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it("returns null when lyrics fetch is not ok", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });

  const { result } = renderHook(() => useLyrics("Artist", "Title"), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toBeNull();
});
