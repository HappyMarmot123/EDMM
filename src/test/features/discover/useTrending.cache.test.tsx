import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  cacheTrack: jest.fn(async () => undefined),
}));

import { useTrending } from "@/features/discover/hooks/useTrending";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

afterEach(() => {
  mockFetch.mockReset();
});

it("does not refetch trending tracks within staleTime", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "audius:cached" }],
  });

  const wrapper = createWrapper();
  const first = renderHook(() => useTrending(), { wrapper });

  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

  renderHook(() => useTrending(), { wrapper });

  expect(mockFetch).toHaveBeenCalledTimes(1);
});
