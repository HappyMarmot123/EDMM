import { GET } from "@/app/api/lyrics/route";
import { findLrclibLyrics } from "@/shared/api/lyrics/lrclibClient";

jest.mock("@/shared/api/lyrics/lrclibClient", () => ({
  findLrclibLyrics: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (
      body: unknown,
      init?: { status?: number; headers?: Record<string, string> },
    ) => {
      const headers = new Map<string, string>();
      Object.entries(init?.headers ?? {}).forEach(([key, value]) => {
        headers.set(key.toLowerCase(), String(value));
      });

      return {
        status: init?.status ?? 200,
        headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
        json: async () => body,
      };
    },
  },
}));

const mockFindLrclibLyrics = jest.mocked(findLrclibLyrics);
const request = (query: string) =>
  ({ url: `http://localhost/api/lyrics?${query}` }) as Request;
const validQuery = new URLSearchParams({
  trackId: "cloudinary:asset-1",
  trackName: "Synthetic Song",
  artistName: "Synthetic Artist",
  durationMs: "180000",
}).toString();

beforeEach(() => {
  mockFindLrclibLyrics.mockReset();
});

it.each([
  ["missing trackId", "trackName=Synthetic+Song&artistName=Synthetic+Artist&durationMs=180000"],
  ["blank trackName", "trackId=cloudinary%3Aasset-1&trackName=+&artistName=Synthetic+Artist&durationMs=180000"],
  ["missing artistName", "trackId=cloudinary%3Aasset-1&trackName=Synthetic+Song&durationMs=180000"],
  ["non-numeric duration", "trackId=cloudinary%3Aasset-1&trackName=Synthetic+Song&artistName=Synthetic+Artist&durationMs=nope"],
  ["zero duration", "trackId=cloudinary%3Aasset-1&trackName=Synthetic+Song&artistName=Synthetic+Artist&durationMs=0"],
  ["fractional duration", "trackId=cloudinary%3Aasset-1&trackName=Synthetic+Song&artistName=Synthetic+Artist&durationMs=180000.5"],
])("returns 400 for %s", async (_case, query) => {
  const response = await GET(request(query));

  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ error: "Invalid lyrics request" });
  expect(mockFindLrclibLyrics).not.toHaveBeenCalled();
});

it("returns 404 with negative caching when no strict match exists", async () => {
  mockFindLrclibLyrics.mockResolvedValueOnce(null);

  const response = await GET(request(validQuery));

  expect(response.status).toBe(404);
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
  );
  expect(await response.json()).toEqual({ error: "Synced lyrics not found" });
});

it("returns a normalized lyrics document and success cache policy", async () => {
  mockFindLrclibLyrics.mockResolvedValueOnce({
    providerId: 77,
    instrumental: false,
    syncedLyrics: "[00:01.00]First synthetic line\n[00:03.50]Second synthetic line",
  });

  const response = await GET(request(validQuery));

  expect(mockFindLrclibLyrics).toHaveBeenCalledWith({
    trackName: "Synthetic Song",
    artistName: "Synthetic Artist",
    durationMs: 180_000,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  );
  expect(await response.json()).toEqual({
    trackId: "cloudinary:asset-1",
    source: "lrclib",
    providerId: 77,
    instrumental: false,
    durationMs: 180_000,
    lines: [
      { startMs: 1_000, endMs: 3_500, text: "First synthetic line" },
      { startMs: 3_500, endMs: 180_000, text: "Second synthetic line" },
    ],
  });
});

it("returns an empty line list for a verified instrumental track", async () => {
  mockFindLrclibLyrics.mockResolvedValueOnce({
    providerId: 88,
    instrumental: true,
    syncedLyrics: null,
  });

  const response = await GET(request(validQuery));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ instrumental: true, lines: [] });
});

it.each([
  ["upstream failure", new Error("private upstream detail")],
  ["malformed synchronized lyrics", null],
])("returns a sanitized 502 for %s", async (_case, failure) => {
  if (failure) {
    mockFindLrclibLyrics.mockRejectedValueOnce(failure);
  } else {
    mockFindLrclibLyrics.mockResolvedValueOnce({
      providerId: 77,
      instrumental: false,
      syncedLyrics: "malformed provider payload",
    });
  }

  const response = await GET(request(validQuery));

  expect(response.status).toBe(502);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ error: "Lyrics provider unavailable" });
});
