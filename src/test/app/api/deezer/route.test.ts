import { GET } from "@/app/api/deezer/search/route";
import { searchDeezer } from "@/shared/api/deezer/deezerClient";

jest.mock("@/shared/api/deezer/deezerClient", () => ({
  searchDeezer: jest.fn(async () => [{ id: "deezer:search" }]),
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

const mockSearchDeezer = searchDeezer as jest.MockedFunction<
  typeof searchDeezer
>;

const request = (url: string) => ({ url }) as Request;

beforeEach(() => {
  mockSearchDeezer.mockReset();
  mockSearchDeezer.mockResolvedValue([
    { id: "deezer:search" },
  ] as Awaited<ReturnType<typeof searchDeezer>>);
});

it("search route returns empty array when q is empty", async () => {
  const res = await GET(request("http://x/api/deezer/search"));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual([]);
  expect(searchDeezer).not.toHaveBeenCalled();
});

it("search route returns empty array when q is whitespace", async () => {
  const res = await GET(request("http://x/api/deezer/search?q=%20%20"));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual([]);
  expect(searchDeezer).not.toHaveBeenCalled();
});

it("search route returns Deezer search results", async () => {
  const res = await GET(request("http://x/api/deezer/search?q=house"));
  const body = await res.json();

  expect(searchDeezer).toHaveBeenCalledWith("house");
  expect(body[0].id).toBe("deezer:search");
});

it("search route returns 502 json when upstream rejects", async () => {
  mockSearchDeezer.mockRejectedValueOnce(new Error("search failed"));

  const res = await GET(request("http://x/api/deezer/search?q=house"));
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body).toEqual({ error: "Error: search failed" });
});
