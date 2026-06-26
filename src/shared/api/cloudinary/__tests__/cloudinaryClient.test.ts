import {
  buildCloudinaryExpression,
  clearCloudinaryTrackCacheForTests,
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
} from "../cloudinaryClient";

global.fetch = jest.fn();

const originalEnv = process.env;
const mockFetch = global.fetch as jest.Mock;

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
  it("builds a folder-scoped video expression for blank queries", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline", "")).toBe(
      'resource_type:video AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("builds an image expression when requested", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline", "", "image")).toBe(
      'resource_type:image AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("builds an all-type expression when requested", () => {
    expect(buildCloudinaryExpression("edmm/media-pipeline", "", "all")).toBe(
      '(resource_type:video OR resource_type:image) AND (asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
  });

  it("builds prefix wildcard search clauses from safe tokens", () => {
    const expression = buildCloudinaryExpression(
      "edmm/media-pipeline",
      "  lemonade  ",
    );

    expect(expression).toContain(
      '(asset_folder="edmm/media-pipeline" OR folder="edmm/media-pipeline")',
    );
    expect(expression).toContain("public_id:lemonade*");
    expect(expression).toContain("filename:lemonade*");
    expect(expression).toContain("tags:lemonade*");
    expect(expression).toContain("context:lemonade*");
    expect(expression).not.toContain(":*lemonade");
    expect(expression).not.toContain("metadata");
  });

  it("drops unsafe search syntax instead of interpolating raw q", () => {
    const expression = buildCloudinaryExpression(
      "edmm/media-pipeline",
      'lemonade") OR resource_type:image OR tags:* aespa-kpop remix_01',
    );

    expect(expression).toContain("public_id:lemonade*");
    expect(expression).toContain("public_id:aespa-kpop*");
    expect(expression).toContain("public_id:remix_01*");
    expect(expression).not.toContain('lemonade")');
    expect(expression).not.toContain("resource_type:image");
    expect(expression).not.toContain("tags:*");
  });

  it("caps the number of search tokens", () => {
    const expression = buildCloudinaryExpression(
      "edmm/media-pipeline",
      "one two three four five six seven eight nine",
    );

    expect(expression).toContain("public_id:eight*");
    expect(expression).not.toContain("public_id:nine*");
  });
});

describe("cache policy", () => {
  it("returns default cache policies by resource type", () => {
    expect(getCloudinaryTrackCachePolicy("video").cacheTtlMs).toBe(60_000);
    expect(getCloudinaryTrackCachePolicy("image").cacheTtlMs).toBe(300_000);
    expect(getCloudinaryTrackCachePolicy("all").cacheTtlMs).toBe(120_000);
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
      cache: "no-store",
      headers: {
        Authorization: `Basic ${Buffer.from("api-key:api-secret").toString(
          "base64",
        )}`,
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
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ cache: "no-store" });
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

  it("includes the search term in the Cloudinary expression", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [] }),
    });

    await fetchCloudinaryTracks("lemonade");

    const url = new URL(mockFetch.mock.calls[0][0].toString());
    const expression = url.searchParams.get("expression") ?? "";

    expect(expression).toContain("public_id:lemonade*");
    expect(expression).toContain("filename:lemonade*");
    expect(expression).toContain("tags:lemonade*");
    expect(expression).not.toContain("metadata");
    expect(expression).not.toContain(":*lemonade");
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

  it("caches responses by normalized query", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [rawResource] }),
    });

    const first = await fetchCloudinaryTracks("  lemonade  ");
    const second = await fetchCloudinaryTracks("lemonade");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("evicts oldest cached responses when the cache exceeds its entry limit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [] }),
    });

    for (let index = 0; index < 101; index += 1) {
      await fetchCloudinaryTracks(`query-${index}`);
    }

    await fetchCloudinaryTracks("query-0");

    expect(mockFetch).toHaveBeenCalledTimes(102);
  });

  it("rejects when Cloudinary returns a non-OK response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary search failed with status 503",
    );
  });
});
