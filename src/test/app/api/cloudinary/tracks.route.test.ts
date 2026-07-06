import { GET } from "@/app/api/cloudinary/tracks/route";
import {
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
} from "@/shared/api/cloudinary/cloudinaryClient";

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

jest.mock("@/shared/api/cloudinary/cloudinaryClient", () => {
  const actual = jest.requireActual(
    "@/shared/api/cloudinary/cloudinaryClient",
  );

  return {
    ...actual,
    fetchCloudinaryTracks: jest.fn(async () => [{ id: "cloudinary:asset-1" }]),
  };
});

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
      headers: { get: (name: string) => map.get(name.toLowerCase()) ?? null },
      json: async () => body,
      };
    },
  },
}));

const mockFetchCloudinaryTracks = fetchCloudinaryTracks as jest.MockedFunction<
  typeof fetchCloudinaryTracks
>;

const request = (url: string) => ({ url }) as Request;

beforeEach(() => {
  mockFetchCloudinaryTracks.mockReset();
  mockFetchCloudinaryTracks.mockResolvedValue([
    { id: "cloudinary:asset-1" },
  ] as Awaited<ReturnType<typeof fetchCloudinaryTracks>>);
});

it("returns JSON tracks", async () => {
  const res = await GET(request("http://x/api/cloudinary/tracks"));
  const body = await res.json();

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", { resourceType: "all" });
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe(
    buildCloudinaryCacheHeader(getCloudinaryTrackCachePolicy("all")),
  );
  expect(body).toEqual([{ id: "cloudinary:asset-1" }]);
});

it("passes q to the Cloudinary client", async () => {
  await GET(request("http://x/api/cloudinary/tracks?q=lemonade"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("lemonade", { resourceType: "all" });
});

it("passes filterPlayable=true to the Cloudinary client", async () => {
  await GET(
    request("http://x/api/cloudinary/tracks?resourceType=all&filterPlayable=true"),
  );

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
    filterPlayable: true,
  });
});

it("passes explicit filterPlayable=false to the Cloudinary client", async () => {
  await GET(
    request("http://x/api/cloudinary/tracks?resourceType=all&filterPlayable=false"),
  );

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
    filterPlayable: false,
  });
});

it("passes resourceType query parameter through", async () => {
  await GET(request("http://x/api/cloudinary/tracks?resourceType=all"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
  });
});

it("passes a known category to the Cloudinary client", async () => {
  await GET(request("http://x/api/cloudinary/tracks?category=pop"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
    category: "pop",
  });
});

it("passes cache version to the Cloudinary client", async () => {
  await GET(request("http://x/api/cloudinary/tracks?v=4&category=pop"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
    category: "pop",
    cacheVersion: "4",
  });
});

it("ignores an unknown category", async () => {
  await GET(request("http://x/api/cloudinary/tracks?category=hacker"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", {
    resourceType: "all",
  });
});

it("returns 500 when Cloudinary configuration is missing", async () => {
  mockFetchCloudinaryTracks.mockRejectedValueOnce(
    new Error("Cloudinary configuration is missing"),
  );

  const res = await GET(request("http://x/api/cloudinary/tracks"));
  const body = await res.json();

  expect(res.status).toBe(500);
  expect(body).toEqual({ error: "Cloudinary configuration is missing" });
});

it("returns 502 when Cloudinary search fails upstream", async () => {
  mockFetchCloudinaryTracks.mockRejectedValueOnce(
    new Error("Cloudinary search failed with status 503"),
  );

  const res = await GET(request("http://x/api/cloudinary/tracks?q=lemonade"));
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Cloudinary search failed with status 503" });
});
