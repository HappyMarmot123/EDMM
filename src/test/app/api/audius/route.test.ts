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
const mockFetch = jest.fn();

class TestHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: HeadersInit | TestHeaders) {
    if (!init) return;
    if (init instanceof TestHeaders) {
      init.values.forEach((value, key) => this.set(key, value));
      return;
    }
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.set(key, value));
      return;
    }
    if (typeof init === "object") {
      Object.entries(init).forEach(([key, value]) => this.set(key, value));
    }
  }

  get(name: string) {
    return this.values.get(name.toLowerCase()) ?? null;
  }

  set(name: string, value: string) {
    this.values.set(name.toLowerCase(), value);
  }
}

class TestResponse {
  readonly body: BodyInit | null;
  readonly headers: TestHeaders;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;

  constructor(body: BodyInit | null, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? "";
    this.headers = new TestHeaders(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  async text() {
    return typeof this.body === "string" ? this.body : "";
  }
}

global.Headers = TestHeaders as unknown as typeof Headers;
global.Response = TestResponse as unknown as typeof Response;
global.fetch = mockFetch as unknown as typeof fetch;

const request = (url: string, init?: RequestInit) =>
  ({
    url,
    headers: new Headers(init?.headers),
  }) as Request;

beforeEach(() => {
  mockFetch.mockReset();
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
  mockFetch.mockResolvedValue(
    new Response("audio-bytes", {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "accept-ranges": "bytes",
        "content-length": "11",
        "content-range": "bytes 0-10/100",
        "content-type": "audio/mpeg",
      },
    }),
  );
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

it("stream route returns 502 json when getAudiusHost rejects", async () => {
  mockGetAudiusHost.mockRejectedValueOnce(new Error("host failed"));

  const res = await streamGET(request("http://x/api/audius/stream/track-1"), {
    params: Promise.resolve({ id: "track-1" }),
  });
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Error: host failed" });
});

it("stream route proxies the Audius stream instead of redirecting", async () => {
  const res = await streamGET(
    request("http://x/api/audius/stream/track-1", {
      headers: { range: "bytes=0-10" },
    }),
    {
      params: Promise.resolve({ id: "track-1" }),
    },
  );

  expect(getAudiusHost).toHaveBeenCalled();
  expect(mockFetch).toHaveBeenCalledWith(
    "https://audius.example/v1/tracks/track-1/stream?app_name=EDMM",
    expect.objectContaining({
      cache: "no-store",
      headers: expect.any(Headers),
    }),
  );
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect((init.headers as Headers).get("range")).toBe("bytes=0-10");
  expect(res.status).toBe(206);
  expect(res.headers.get("content-range")).toBe("bytes 0-10/100");
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
  await expect(res.text()).resolves.toBe("audio-bytes");
});

it("stream route encodes unsafe id characters in proxied URL", async () => {
  const res = await streamGET(
    request("http://x/api/audius/stream/track%2F1%20%3F%23"),
    {
      params: Promise.resolve({ id: "track/1 ?#" }),
    },
  );

  expect(res.status).toBe(206);
  expect(mockFetch).toHaveBeenCalledWith(
    "https://audius.example/v1/tracks/track%2F1%20%3F%23/stream?app_name=EDMM",
    expect.any(Object),
  );
});

it("stream route returns 502 json when upstream stream fails", async () => {
  mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

  const res = await streamGET(request("http://x/api/audius/stream/track-1"), {
    params: Promise.resolve({ id: "track-1" }),
  });
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Audius stream failed with status 404" });
});
