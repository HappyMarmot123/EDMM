import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTrending } from "@/features/discover/hooks/useTrending";

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

it("fetches trending tracks", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:1" }],
  });

  const { result } = renderHook(() => useTrending(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith("/api/audius/trending");
  expect(result.current.data?.[0].id).toBe("audius:1");
});

it("encodes genre when fetching trending tracks", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:genre" }],
  });

  const { result } = renderHook(() => useTrending("hip hop & soul"), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/audius/trending?genre=hip%20hop%20%26%20soul",
  );
});

it("keeps omitted genre separate from explicit all genre in cache", async () => {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "audius:default" }],
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "audius:all" }],
    });

  const wrapper = createWrapper();
  const defaultTrending = renderHook(() => useTrending(), { wrapper });

  await waitFor(() => expect(defaultTrending.result.current.isSuccess).toBe(true));

  const allTrending = renderHook(() => useTrending("all"), { wrapper });

  await waitFor(() =>
    expect(allTrending.result.current.data?.[0].id).toBe("audius:all"),
  );

  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/audius/trending");
  expect(mockFetch).toHaveBeenNthCalledWith(
    2,
    "/api/audius/trending?genre=all",
  );
});

it("trims blank genre to the default trending endpoint", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:trimmed" }],
  });

  const { result } = renderHook(() => useTrending("   "), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith("/api/audius/trending");
});

it("returns an error when trending fetch is not ok", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => [],
  });

  const { result } = renderHook(() => useTrending(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(result.current.error).toEqual(new Error("trending fetch failed"));
});
