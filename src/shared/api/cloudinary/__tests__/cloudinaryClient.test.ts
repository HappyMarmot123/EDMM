import {
  buildCloudinaryExpression,
  clearCloudinaryTrackCacheForTests,
  fetchCloudinaryTracks,
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
      'resource_type:video AND folder="edmm/media-pipeline"',
    );
  });

  it("includes the trimmed search term in the expression", () => {
    const expression = buildCloudinaryExpression(
      "edmm/media-pipeline",
      "  lemonade  ",
    );

    expect(expression).toContain('folder="edmm/media-pipeline"');
    expect(expression).toContain("public_id:*lemonade*");
    expect(expression).toContain("filename:*lemonade*");
    expect(expression).toContain("tags:lemonade");
  });
});

describe("fetchCloudinaryTracks", () => {
  it("calls Cloudinary Search with folder-scoped resource_type:video", async () => {
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
      'resource_type:video AND folder="edmm/media-pipeline"',
    );
    expect(url.searchParams.getAll("with_field")).toEqual([
      "tags",
      "context",
      "metadata",
    ]);
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

  it("includes the search term in the Cloudinary expression", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ resources: [] }),
    });

    await fetchCloudinaryTracks("lemonade");

    const url = new URL(mockFetch.mock.calls[0][0].toString());
    const expression = url.searchParams.get("expression") ?? "";

    expect(expression).toContain("public_id:*lemonade*");
    expect(expression).toContain("filename:*lemonade*");
    expect(expression).toContain("tags:lemonade");
  });

  it("throws when Cloudinary configuration is missing", async () => {
    delete process.env.CLOUDINARY_API_SECRET;

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary configuration is missing",
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

  it("rejects when Cloudinary returns a non-OK response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    await expect(fetchCloudinaryTracks()).rejects.toThrow(
      "Cloudinary search failed with status 503",
    );
  });
});
