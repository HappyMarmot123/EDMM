import fs from "node:fs";
import path from "node:path";
import { revalidateTag } from "next/cache";
import * as cloudinaryClient from "../cloudinaryClient";

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

const {
  buildCloudinaryExpression,
  clearCloudinaryTrackCacheForTests,
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
} = cloudinaryClient;

type CloudinaryClientExports = typeof cloudinaryClient & {
  CLOUDINARY_TRACKS_CACHE_TAG?: string;
  revalidateCloudinaryTrackCache?: () => void;
};

global.fetch = jest.fn();

const originalEnv = process.env;
const mockFetch = global.fetch as jest.Mock;
const mockRevalidateTag = jest.mocked(revalidateTag);
const cloudinaryClientExports = cloudinaryClient as CloudinaryClientExports;
const expectedCloudinaryTracksCacheTag = "cloudinary-tracks";
const readCloudinaryClientSource = () =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src",
      "shared",
      "api",
      "cloudinary",
      "cloudinaryClient.ts",
    ),
    "utf8",
  );

const rawResource = {
  asset_id: "asset-1",
  public_id: "edmm/media-pipeline/aespa LEMONADE MV",
  resource_type: "video",
  type: "upload",
  format: "mp3",
  secure_url: "https://res.cloudinary.com/demo/video/upload/aespa.mp3",
  duration: 191.28,
  tags: ["edmm"],
};
const rawImageResource = {
  asset_id: "asset-img",
  public_id: "edmm/media-pipeline/example-artwork",
  resource_type: "image",
  type: "upload",
  format: "jpg",
  secure_url: "https://res.cloudinary.com/demo/image/upload/art.jpg",
  duration: 0,
  tags: ["edmm"],
};

const setCloudinaryEnv = () => {
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "api-key";
  process.env.CLOUDINARY_API_SECRET = "api-secret";
  process.env.CLOUDINARY_AUDIO_FOLDER = "edmm/media-pipeline";
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  setCloudinaryEnv();
  clearCloudinaryTrackCacheForTests();
});

afterAll(() => {
  process.env = originalEnv;
});

describe("buildCloudinaryExpression", () => {
  it("builds a folder-scoped video expression", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline")).toBe(
      'resource_type:video AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("builds an image expression when requested", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline", "image")).toBe(
      'resource_type:image AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("builds an all-type expression when requested", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline", "all")).toBe(
      '(resource_type:video OR resource_type:image) AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });
});

describe("cache policy", () => {
  it("returns default cache policies by resource type", () => {
    expect(getCloudinaryTrackCachePolicy("video")).toMatchObject({
      cacheTtlMs: 86_400_000,
      browserCacheTtlMs: 300_000,
      staleWhileRevalidateMs: 604_800_000,
      maxResults: 100,
    });
    expect(getCloudinaryTrackCachePolicy("image")).toMatchObject({
      cacheTtlMs: 86_400_000,
      browserCacheTtlMs: 300_000,
      staleWhileRevalidateMs: 604_800_000,
      maxResults: 100,
    });
    expect(getCloudinaryTrackCachePolicy("all")).toMatchObject({
      cacheTtlMs: 86_400_000,
      browserCacheTtlMs: 300_000,
      staleWhileRevalidateMs: 604_800_000,
      maxResults: 100,
    });
  });

  it("builds cache headers from policy", () => {
    const header = buildCloudinaryCacheHeader({
      cacheTtlMs: 90_000,
      maxResults: 50,
    });

    expect(header).toBe(
      "public, max-age=90, s-maxage=90, stale-while-revalidate=90",
    );
  });

  it("builds long server cache headers with a short browser max-age", () => {
    expect(
      buildCloudinaryCacheHeader(getCloudinaryTrackCachePolicy("video")),
    ).toBe(
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
    );
  });

  it("delegates response caching to the Next Data Cache", () => {
    const source = readCloudinaryClientSource();

    expect(source).not.toContain("responseCache");
    expect(source).not.toContain('cache: "no-store"');
    expect(source).toContain('cache: "force-cache"');
    expect(source).toContain("CLOUDINARY_TRACKS_CACHE_TAG");
    expect(cloudinaryClientExports.CLOUDINARY_TRACKS_CACHE_TAG).toBe(
      expectedCloudinaryTracksCacheTag,
    );
  });

  it("revalidates the Cloudinary track cache tag with the max profile", () => {
    expect(cloudinaryClientExports.revalidateCloudinaryTrackCache).toEqual(
      expect.any(Function),
    );

    cloudinaryClientExports.revalidateCloudinaryTrackCache?.();

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      expectedCloudinaryTracksCacheTag,
      "max",
    );
  });
});

describe("fetchCloudinaryTracks", () => {
  it("calls Cloudinary Search with folder-scoped video expression by default", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [rawResource] }),
    });

    const tracks = await fetchCloudinaryTracks("");

    const [requestUrl, init] = mockFetch.mock.calls[0] as [
      string | URL,
      RequestInit,
    ];
    const url = new URL(requestUrl.toString());

    expect(url.origin).toBe("https://api.cloudinary.com");
    expect(url.pathname).toBe("/v1_1/demo/resources/search");
    expect(url.searchParams.get("expression")).toBe(
      'resource_type:video AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
    expect(url.searchParams.getAll("with_field")).toEqual(["tags", "context"]);
    expect(init).toMatchObject({
      cache: "force-cache",
      headers: {
        Authorization: `Basic ${Buffer.from("api-key:api-secret").toString(
          "base64",
        )}`,
      },
      next: {
        revalidate: 86_400,
        tags: [expectedCloudinaryTracksCacheTag],
      },
    });
    expect(tracks[0]).toMatchObject({
      id: "cloudinary:asset-1",
      source: "cloudinary",
    });
  });

  it("calls Cloudinary Search with image expression when resourceType=image", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [rawResource] }),
    });

    await fetchCloudinaryTracks("", { resourceType: "image" });

    const requestUrl = mockFetch.mock.calls[0][0];
    const url = new URL(requestUrl.toString());

    expect(url.searchParams.get("expression")).toBe(
      'resource_type:image AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("calls Cloudinary Search with combined expression when resourceType=all", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [rawResource] }),
    });

    await fetchCloudinaryTracks("", { resourceType: "all" });

    const requestUrl = mockFetch.mock.calls[0][0];
    const url = new URL(requestUrl.toString());

    expect(url.searchParams.get("expression")).toBe(
      '(resource_type:video OR resource_type:image) AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("scopes the search to the category subfolder when provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [rawResource] }),
    });

    await fetchCloudinaryTracks("", { resourceType: "all", category: "pop" });

    const requestUrl = mockFetch.mock.calls[0][0];
    const url = new URL(requestUrl.toString());

    expect(url.searchParams.get("expression")).toBe(
      '(resource_type:video OR resource_type:image) AND (asset_folder="edmm/media-pipeline/pop" OR folder="edmm/media-pipeline/pop")',
    );
  });

  it("returns mixed resources when resourceType=all and filterPlayable is disabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resources: [rawResource, rawImageResource] }),
    });

    const tracks = await fetchCloudinaryTracks("", { resourceType: "all" });

    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({
      id: "cloudinary:asset-1",
      source: "cloudinary",
      metadata: expect.objectContaining({ resourceType: "video" }),
    });
    expect(tracks[1]).toMatchObject({
      id: "cloudinary:asset-img",
      source: "cloudinary",
      metadata: expect.objectContaining({ resourceType: "image" }),
    });
  });

  it("filters image resources when filterPlayable is enabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resources: [rawResource, rawImageResource] }),
    });

    const tracks = await fetchCloudinaryTracks("", {
      resourceType: "all",
      filterPlayable: true,
    });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: "cloudinary:asset-1",
      source: "cloudinary",
      metadata: expect.objectContaining({ resourceType: "video" }),
    });
  });

  it("returns image resources when filterPlayable is disabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resources: [rawImageResource] }),
    });

    const tracks = await fetchCloudinaryTracks("", {
      resourceType: "all",
      filterPlayable: false,
    });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: "cloudinary:asset-img",
      metadata: expect.objectContaining({ resourceType: "image" }),
    });
  });

  it("fetches all Cloudinary pages using next_cursor", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [rawResource],
          next_cursor: "cursor-1",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: [{ ...rawResource, asset_id: "asset-2", public_id: "edmm/media-pipeline/b.mp3" }],
        }),
      });

    const tracks = await fetchCloudinaryTracks();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0].toString()).toContain("max_results=100");
    expect(mockFetch.mock.calls[1][0].toString()).toContain("next_cursor=cursor-1");
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      cache: "force-cache",
      next: {
        revalidate: 86_400,
        tags: [expectedCloudinaryTracksCacheTag],
      },
    });
    expect(mockFetch.mock.calls[1][1]).toMatchObject({
      cache: "force-cache",
      next: {
        revalidate: 86_400,
        tags: [expectedCloudinaryTracksCacheTag],
      },
    });
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({ id: "cloudinary:asset-1" });
    expect(tracks[1]).toMatchObject({ id: "cloudinary:asset-2" });
  });

  it("errors when pagination loops too much", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          resources: [rawResource],
          next_cursor: "cursor-loop",
        }),
      }),
    );

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary search pagination exceeded safety limit",
    );
  });

  describe("local query filtering", () => {
    const wallsResource = {
      asset_id: "asset-walls",
      public_id: "edmm/media-pipeline/Screamarts_Blocksberg_-_Walls_xgwuyq",
      resource_type: "video",
      type: "upload",
      format: "mp4",
      secure_url: "https://res.cloudinary.com/demo/video/upload/walls.mp4",
      duration: 200,
      tags: [],
      context: { custom: { caption: "Walls", alt: "Screamarts & Blocksberg" } },
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ resources: [rawResource, wallsResource] }),
      });
    });

    it("keeps the remote expression free of query tokens", async () => {
      await fetchCloudinaryTracks("Wall");

      const url = new URL(mockFetch.mock.calls[0][0].toString());
      const expression = url.searchParams.get("expression") ?? "";

      expect(expression).toBe(
        'resource_type:video AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
      );
    });

    it("matches partial title text case-insensitively", async () => {
      const tracks = await fetchCloudinaryTracks("wall");

      expect(tracks.map((track) => track.id)).toEqual([
        "cloudinary:asset-walls",
      ]);
    });

    it("matches by artist name", async () => {
      const tracks = await fetchCloudinaryTracks("screamarts");

      expect(tracks.map((track) => track.id)).toEqual([
        "cloudinary:asset-walls",
      ]);
    });

    it("matches by track title", async () => {
      // rawResource has no caption, so its title falls back to the filename stem
      const tracks = await fetchCloudinaryTracks("lemonade");

      expect(tracks.map((track) => track.id)).toEqual(["cloudinary:asset-1"]);
    });

    it("does not match album, folder, or tag values", async () => {
      // albumName falls back to the parent folder "media-pipeline";
      // rawResource carries the "edmm" tag — neither is searchable
      expect(await fetchCloudinaryTracks("media-pipeline")).toEqual([]);
      expect(await fetchCloudinaryTracks("edmm")).toEqual([]);
    });

    it("requires every query token to match", async () => {
      const tracks = await fetchCloudinaryTracks("screamarts walls");

      expect(tracks.map((track) => track.id)).toEqual([
        "cloudinary:asset-walls",
      ]);
      expect(await fetchCloudinaryTracks("screamarts lemonade")).toEqual([]);
    });

    it("returns nothing when no track matches", async () => {
      expect(await fetchCloudinaryTracks("zzzz")).toEqual([]);
    });

    it("returns everything for a blank query", async () => {
      const tracks = await fetchCloudinaryTracks("");

      expect(tracks).toHaveLength(2);
    });
  });

  it("throws when Cloudinary configuration is missing", async () => {
    delete process.env.CLOUDINARY_API_SECRET;

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary configuration is missing",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws before fetching when called in a browser environment", async () => {
    const originalProcess = globalThis.process;
    let thrown: unknown;

    Object.defineProperty(globalThis, "process", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      await fetchCloudinaryTracks();
    } catch (error) {
      thrown = error;
    } finally {
      Object.defineProperty(globalThis, "process", {
        configurable: true,
        writable: true,
        value: originalProcess,
      });
    }

    expect(thrown).toEqual(
      new Error("Cloudinary client can only be used on the server"),
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects when Cloudinary returns a non-OK response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary search failed with status 503",
    );
  });
});
