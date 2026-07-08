import type { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { cacheTrack } from "@/shared/db";

jest.mock("@/shared/db", () => ({
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

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/video?v=4&q=lemonade");
  expect(mockCacheTrack).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "cloudinary:asset-1",
    }),
  );
});

it("fetches and merges video and image tracks with a single all request", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: "video:asset-1",
        source: "cloudinary",
        title: "Track One",
        artistId: "artist:Track One",
        artistName: "Cloudinary Artist",
        albumName: "Default album",
        artworkUrl: "",
        durationMs: 120000,
        metadata: {},
      },
      {
        id: "cloudinary:image-1",
        source: "cloudinary",
        title: "Track One",
        artistId: "artist:Track One",
        artistName: "Cloudinary Artist",
        albumName: "Default album",
        artworkUrl: "https://example.com/track-one.jpg",
        durationMs: 120000,
        metadata: {
          resourceType: "image",
        },
      },
    ],
  });

  const { result } = renderHook(
    () =>
      useCloudinaryTracks("  lemonade  ", {
        resourceType: "all",
      }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/cloudinary/tracks?v=4&resourceType=all&q=lemonade",
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(result.current.data).toHaveLength(1);
  expect(result.current.data?.[0]).toMatchObject({
    id: "video:asset-1",
    artworkUrl: "https://example.com/track-one.jpg",
  });
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

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/image?v=4&q=lemonade");
});

it("calls a single request for resourceType=all and applies playable filtering in the hook", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: "video:asset-1",
        source: "cloudinary",
        title: "Track One",
        artistId: "artist:Track One",
        artistName: "Cloudinary Artist",
        albumName: "Default album",
        artworkUrl: "",
        durationMs: 120000,
        streamUrl: "https://example.com/track-one.mp3",
        metadata: {
          resourceType: "video",
        },
      },
      {
        id: "video:asset-2",
        source: "cloudinary",
        title: "Track Two",
        artistId: "artist:Track Two",
        artistName: "Cloudinary Artist",
        albumName: "Default album",
        artworkUrl: "",
        durationMs: 120000,
        metadata: {
          resourceType: "video",
        },
      },
      {
        id: "cloudinary:image-1",
        source: "cloudinary",
        title: "Track One",
        artistId: "artist:Track One",
        artistName: "Cloudinary Artist",
        albumName: "Default album",
        artworkUrl: "https://example.com/track-one.jpg",
        durationMs: 120000,
        metadata: {
          resourceType: "image",
        },
      },
    ],
  });

  const { result } = renderHook(
    () =>
      useCloudinaryTracks("  lemonade  ", {
        resourceType: "all",
        filterPlayable: true,
      }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/cloudinary/tracks?v=4&resourceType=all&q=lemonade",
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(result.current.data).toHaveLength(1);
  expect(result.current.data?.[0]).toMatchObject({
    id: "video:asset-1",
    artworkUrl: "https://example.com/track-one.jpg",
  });
});

it("passes category with a single all request for resourceType=all", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  const { result } = renderHook(
    () => useCloudinaryTracks("", { resourceType: "all", category: "pop" }),
    {
      wrapper: createWrapper(),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockFetch).toHaveBeenCalledWith(
    "/api/cloudinary/tracks?v=4&resourceType=all&category=pop",
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
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

  expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks/video?v=4");
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
