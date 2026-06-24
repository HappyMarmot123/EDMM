import { GET as searchGET } from "@/app/api/audius/search/route";
import { GET as streamGET } from "@/app/api/audius/stream/[id]/route";
import { GET as trendingGET } from "@/app/api/audius/trending/route";
import {
  fetchTrending,
  getAudiusHost,
  searchAudiusTracks,
} from "@/shared/api/audius/audiusClient";

jest.mock("@/shared/api/audius/audiusClient", () => ({
  fetchTrending: jest.fn(async () => [{ id: "audius:1" }]),
  getAudiusHost: jest.fn(async () => "https://audius.example"),
  searchAudiusTracks: jest.fn(async () => [{ id: "audius:search" }]),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: async () => body,
    }),
    redirect: (url: string | URL, init?: number | { status?: number }) => {
      const status = typeof init === "number" ? init : init?.status ?? 307;

      return {
        status,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "location" ? String(url) : null,
        },
      };
    },
  },
}));

const mockFetchTrending = fetchTrending as jest.MockedFunction<
  typeof fetchTrending
>;
const mockGetAudiusHost = getAudiusHost as jest.MockedFunction<
  typeof getAudiusHost
>;
const mockSearchAudiusTracks = searchAudiusTracks as jest.MockedFunction<
  typeof searchAudiusTracks
>;

const request = (url: string) => ({ url }) as Request;

beforeEach(() => {
  mockFetchTrending.mockReset();
  mockGetAudiusHost.mockReset();
  mockSearchAudiusTracks.mockReset();

  mockFetchTrending.mockResolvedValue([
    { id: "audius:1" },
  ] as Awaited<ReturnType<typeof fetchTrending>>);
  mockGetAudiusHost.mockResolvedValue("https://audius.example");
  mockSearchAudiusTracks.mockResolvedValue([
    { id: "audius:search" },
  ] as Awaited<ReturnType<typeof searchAudiusTracks>>);
});

it("trending route returns json array", async () => {
  const res = await trendingGET(request("http://x/api/audius/trending"));
  const body = await res.json();

  expect(Array.isArray(body)).toBe(true);
  expect(body[0].id).toBe("audius:1");
});

it("trending route passes genre to fetchTrending", async () => {
  const res = await trendingGET(
    request("http://x/api/audius/trending?genre=Electronic"),
  );
  const body = await res.json();

  expect(fetchTrending).toHaveBeenCalledWith("Electronic");
  expect(body[0].id).toBe("audius:1");
});

it("trending route returns 502 json when upstream rejects", async () => {
  mockFetchTrending.mockRejectedValueOnce(new Error("trending failed"));

  const res = await trendingGET(request("http://x/api/audius/trending"));
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Error: trending failed" });
});

it("search route returns empty array when q is empty", async () => {
  const res = await searchGET(request("http://x/api/audius/search"));
  const body = await res.json();

  expect(body).toEqual([]);
  expect(searchAudiusTracks).not.toHaveBeenCalled();
});

it("search route passes q to Audius search", async () => {
  const res = await searchGET(request("http://x/api/audius/search?q=house"));
  const body = await res.json();

  expect(searchAudiusTracks).toHaveBeenCalledWith("house");
  expect(body[0].id).toBe("audius:search");
});

it("search route returns 502 json when upstream rejects", async () => {
  mockSearchAudiusTracks.mockRejectedValueOnce(new Error("search failed"));

  const res = await searchGET(request("http://x/api/audius/search?q=house"));
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Error: search failed" });
});

it("stream route redirects to Audius stream URL", async () => {
  const res = await streamGET(request("http://x/api/audius/stream/track-1"), {
    params: Promise.resolve({ id: "track-1" }),
  });

  expect(getAudiusHost).toHaveBeenCalled();
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(
    "https://audius.example/v1/tracks/track-1/stream?app_name=EDMM",
  );
});

it("stream route returns 502 json when getAudiusHost rejects", async () => {
  mockGetAudiusHost.mockRejectedValueOnce(new Error("host failed"));

  const res = await streamGET(request("http://x/api/audius/stream/track-1"), {
    params: Promise.resolve({ id: "track-1" }),
  });
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Error: host failed" });
});

it("stream route encodes unsafe id characters in redirect URL", async () => {
  const res = await streamGET(
    request("http://x/api/audius/stream/track%2F1%20%3F%23"),
    {
      params: Promise.resolve({ id: "track/1 ?#" }),
    },
  );

  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(
    "https://audius.example/v1/tracks/track%2F1%20%3F%23/stream?app_name=EDMM",
  );
});
