import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";

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

it("does not fetch when query is blank", () => {
  const { result } = renderHook(() => useTrackSearch("   "), {
    wrapper: createWrapper(),
  });

  expect(result.current.data).toBeUndefined();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("trims and encodes nonblank queries when fetching tracks", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:search" }],
  });

  const { result } = renderHook(() => useTrackSearch("  lo fi & soul  "), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/audius/search?q=lo%20fi%20%26%20soul",
  );
  expect(result.current.data?.[0].id).toBe("audius:search");
});

it("uses trimmed queries as cache keys", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:cached" }],
  });

  const wrapper = createWrapper();
  const first = renderHook(() => useTrackSearch("  same song  "), { wrapper });

  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

  const second = renderHook(() => useTrackSearch("same song"), { wrapper });

  await waitFor(() =>
    expect(second.result.current.data?.[0].id).toBe("audius:cached"),
  );

  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it("returns an error when search fetch is not ok", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => [],
  });

  const { result } = renderHook(() => useTrackSearch("bad query"), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(result.current.error).toEqual(new Error("search failed"));
});
