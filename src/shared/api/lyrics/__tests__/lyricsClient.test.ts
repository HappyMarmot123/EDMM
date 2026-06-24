import { fetchLyrics } from "../lyricsClient";

global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

it("returns lyrics string", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ lyrics: "la la" }) });
  expect(await fetchLyrics("A", "T")).toBe("la la");
});

it("returns null on 404", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
  expect(await fetchLyrics("A", "T")).toBeNull();
});

it("returns null when lyrics are missing", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  expect(await fetchLyrics("A", "T")).toBeNull();
});

it("returns null when fetch rejects", async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network failure"));
  expect(await fetchLyrics("A", "T")).toBeNull();
});

it("returns null when JSON parsing rejects", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => {
      throw new SyntaxError("Unexpected token");
    },
  });

  expect(await fetchLyrics("A", "T")).toBeNull();
});

it("URL-encodes artist and title", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

  await fetchLyrics("A B", "T/T?");

  expect(global.fetch).toHaveBeenCalledWith("https://api.lyrics.ovh/v1/A%20B/T%2FT%3F");
});
