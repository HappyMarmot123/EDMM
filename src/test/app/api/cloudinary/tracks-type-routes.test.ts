import {
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
} from "@/shared/api/cloudinary/cloudinaryClient";
import type { Track } from "@/entities/track/model";
import { GET as GET_IMAGE } from "@/app/api/cloudinary/tracks/image/route";
import { GET as GET_VIDEO } from "@/app/api/cloudinary/tracks/video/route";

const trackFixture: Track = {
  id: "cloudinary:asset-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "cloudinary:artist-1",
  artistName: "Cloudinary Artist",
  albumName: "Default album",
  artworkUrl: "",
  durationMs: 120000,
  metadata: {},
};

jest.mock("@/shared/api/cloudinary/cloudinaryClient", () => ({
  fetchCloudinaryTracks: jest.fn(async () => [trackFixture]),
  buildCloudinaryCacheHeader: jest.fn((policy) =>
    `public, max-age=${Math.floor(policy.cacheTtlMs / 1000)}`,
  ),
  getCloudinaryTrackCachePolicy: jest.fn((resourceType) => ({
    cacheTtlMs:
      resourceType === "image"
        ? 300_000
        : resourceType === "all"
          ? 120_000
          : 60_000,
  })),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
      const headers = init?.headers ?? {};
      const map = new Map<string, string>();

      Object.entries(headers).forEach(([key, value]) => {
        map.set(key.toLowerCase(), String(value));
      });

      return {
        status: init?.status ?? 200,
        headers: {
          get: (name: string) => map.get(name.toLowerCase()) ?? null,
        },
        json: async () => body,
      };
    },
  },
}));

const mockFetchCloudinaryTracks = fetchCloudinaryTracks as jest.MockedFunction<
  typeof fetchCloudinaryTracks
>;
const mockGetPolicy = getCloudinaryTrackCachePolicy as jest.MockedFunction<
  typeof getCloudinaryTrackCachePolicy
>;
const mockBuildHeader = buildCloudinaryCacheHeader as jest.MockedFunction<
  typeof buildCloudinaryCacheHeader
>;

const request = (url: string) => ({ url }) as Request;

beforeEach(() => {
  mockFetchCloudinaryTracks.mockReset();
  mockFetchCloudinaryTracks.mockResolvedValue([trackFixture]);
  mockGetPolicy.mockClear();
  mockBuildHeader.mockClear();
});

it("calls Cloudinary with image resource type in the image endpoint", async () => {
  const res = await GET_IMAGE(request("http://x/api/cloudinary/tracks/image?q=lemonade"));
  const body = await res.json();

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("lemonade", {
    resourceType: "image",
  });
  expect(mockGetPolicy).toHaveBeenCalledWith("image", false);
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe(
    `public, max-age=${Math.floor(300_000 / 1000)}`,
  );
  expect(body).toEqual([trackFixture]);
});

it("calls Cloudinary with video resource type in the video endpoint", async () => {
  const res = await GET_VIDEO(
    request("http://x/api/cloudinary/tracks/video?q=lemonade"),
  );
  const body = await res.json();

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("lemonade", {
    resourceType: "video",
  });
  expect(mockGetPolicy).toHaveBeenCalledWith("video", false);
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe(
    `public, max-age=${Math.floor(60_000 / 1000)}`,
  );
  expect(body).toEqual([trackFixture]);
});

it("returns 500 when Cloudinary configuration is missing", async () => {
  mockFetchCloudinaryTracks.mockRejectedValueOnce(
    new Error("Cloudinary configuration is missing"),
  );

  const res = await GET_IMAGE(request("http://x/api/cloudinary/tracks/image"));

  expect(res.status).toBe(500);
});

it("returns 502 when search fails", async () => {
  mockFetchCloudinaryTracks.mockRejectedValueOnce(
    new Error("Cloudinary search failed with status 503"),
  );

  const res = await GET_VIDEO(request("http://x/api/cloudinary/tracks/video"));

  expect(res.status).toBe(502);
});
