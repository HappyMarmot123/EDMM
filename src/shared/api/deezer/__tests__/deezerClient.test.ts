import { searchDeezer } from "../deezerClient";

global.fetch = jest.fn();

const rawTrack = {
  id: 7,
  title: "D",
  duration: 200,
  artist: { id: 9, name: "Ar" },
  album: { title: "Al", cover_medium: "c" },
  preview: "https://prev.mp3",
};

describe("deezerClient", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("searches with an encoded query URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [rawTrack] }),
    });

    const tracks = await searchDeezer("lo fi/한");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.deezer.com/search?q=lo%20fi%2F%ED%95%9C",
    );
    expect(tracks[0].id).toBe("deezer:7");
  });

  it("rejects when the search response is non-OK", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(searchDeezer("lo fi")).rejects.toThrow("Deezer search failed");
  });

  it("rejects when search data is not an array", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 7 } }),
    });

    await expect(searchDeezer("lo fi")).rejects.toThrow("Deezer search failed");
  });

  it("skips malformed rows without an id and adapts valid rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { title: "Missing ID" },
          { id: null, title: "Null ID" },
          { id: "", title: "Empty ID" },
          rawTrack,
        ],
      }),
    });

    const tracks = await searchDeezer("lo fi");

    expect(tracks).toHaveLength(1);
    expect(tracks[0].id).toBe("deezer:7");
  });
});
