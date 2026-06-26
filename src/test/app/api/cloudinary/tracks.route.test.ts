import { GET } from "@/app/api/cloudinary/tracks/route";
import { fetchCloudinaryTracks } from "@/shared/api/cloudinary/cloudinaryClient";

jest.mock("@/shared/api/cloudinary/cloudinaryClient", () => ({
  fetchCloudinaryTracks: jest.fn(async () => [{ id: "cloudinary:asset-1" }]),
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

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("", { resourceType: "video" });
  expect(res.status).toBe(200);
  expect(body).toEqual([{ id: "cloudinary:asset-1" }]);
});

it("passes q to the Cloudinary client", async () => {
  await GET(request("http://x/api/cloudinary/tracks?q=lemonade"));

  expect(fetchCloudinaryTracks).toHaveBeenCalledWith("lemonade", {
    resourceType: "video",
  });
});

it("passes resourceType query parameter through", async () => {
  await GET(request("http://x/api/cloudinary/tracks?resourceType=all"));

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
