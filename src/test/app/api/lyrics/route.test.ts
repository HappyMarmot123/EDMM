import { GET } from "../../../../app/api/lyrics/route";
import { fetchLyrics } from "../../../../shared/api/lyrics/lyricsClient";

jest.mock("../../../../shared/api/lyrics/lyricsClient", () => ({
  fetchLyrics: jest.fn(),
}));

const mockFetchLyrics = fetchLyrics as jest.MockedFunction<typeof fetchLyrics>;
const responseJson = jest.fn((body: unknown, init?: ResponseInit) => ({
  status: init?.status ?? 200,
  json: async () => body,
}));

Object.defineProperty(globalThis, "Response", {
  value: { json: responseJson },
  writable: true,
});

beforeEach(() => {
  mockFetchLyrics.mockReset();
  responseJson.mockClear();
});

it("passes query params to fetchLyrics", async () => {
  mockFetchLyrics.mockResolvedValueOnce("la la");

  await GET({ url: "http://localhost/api/lyrics?artist=A&title=T" } as Request);

  expect(mockFetchLyrics).toHaveBeenCalledWith("A", "T");
});

it("returns lyrics JSON shape", async () => {
  mockFetchLyrics.mockResolvedValueOnce("la la");

  const response = await GET({ url: "http://localhost/api/lyrics?artist=A&title=T" } as Request);

  await expect(response.json()).resolves.toEqual({ lyrics: "la la" });
});

it("returns null lyrics JSON when fetchLyrics throws", async () => {
  mockFetchLyrics.mockRejectedValueOnce(new Error("client failure"));

  const response = await GET({ url: "http://localhost/api/lyrics?artist=A&title=T" } as Request);

  await expect(response.json()).resolves.toEqual({ lyrics: null });
});
