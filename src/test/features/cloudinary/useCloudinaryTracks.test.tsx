import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";

jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  cacheTrack: jest.fn(async () => undefined),
}));

const mockFetch = jest.fn();
const mockCacheTrack = cacheTrack as jest.MockedFunction<typeof cacheTrack>;
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

beforeEach(() => {
  mockFetch.mockReset();
  mockCacheTrack.mockClear();
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("calls the Cloudinary tracks route with encoded nonblank query", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-1" }],
  });

  const { result } = renderHook(() => useCloudinaryTracks("  lemonade  "), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/video?q=lemonade");
  expect(mockCacheTrack).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "cloudinary:asset-1",
    }),
  );
});

it("calls the Cloudinary tracks route with all resource type", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-1" }],
  });

  const { result } = renderHook(
    () => useCloudinaryTracks("  lemonade  ", { resourceType: "all" }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/cloudinary/tracks?resourceType=all&q=lemonade",
  );
});

it("calls the dedicated image tracks route", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-1" }],
  });

  const { result } = renderHook(
    () => useCloudinaryTracks("  lemonade  ", { resourceType: "image" }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/image?q=lemonade");
});

it("calls the Cloudinary tracks route with filterPlayable=false", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-1" }],
  });

  const { result } = renderHook(
    () =>
      useCloudinaryTracks("  lemonade  ", {
        resourceType: "all",
        filterPlayable: false,
      }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/cloudinary/tracks?resourceType=all&q=lemonade&filterPlayable=false",
  );
});

it("omits q for blank queries", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-2" }],
  });

  const { result } = renderHook(() => useCloudinaryTracks("   "), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/video");
});

it("logs cache failures without failing the query", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [{ id: "cloudinary:asset-1" }],
  });
  mockCacheTrack.mockRejectedValueOnce(new Error("cache failed"));

  const { result } = renderHook(() => useCloudinaryTracks("lemonade"), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.[0].id).toBe("cloudinary:asset-1");
  expect(console.warn).toHaveBeenCalledWith(
    "Failed to cache Cloudinary track:",
    expect.any(Error),
  );
});

it("returns an error when the Cloudinary tracks fetch is not ok", async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => [],
  });

  const { result } = renderHook(() => useCloudinaryTracks("lemonade"), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(result.current.error).toEqual(
    new Error("cloudinary tracks fetch failed"),
  );
});
