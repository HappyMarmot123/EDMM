import {
  __resetAudiusHostCacheForTests,
  fetchTrending,
  searchAudiusTracks,
} from "../audiusClient";

global.fetch = jest.fn();

const rawTrack = {
  id: "x",
  title: "S",
  user: { id: "u", name: "N" },
  duration: 60,
  artwork: { "480x480": "a" },
};

describe("audiusClient", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    __resetAudiusHostCacheForTests();
  });

  function mockDiscovery(host = "https://host1") {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [host] }),
    });
  }

  function mockTracksResponse() {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [rawTrack] }),
    });
  }

  it("returns adapted tracks", async () => {
    mockDiscovery();
    mockTracksResponse();

    const tracks = await fetchTrending();

    expect(tracks[0].id).toBe("audius:x");
  });

  it("fetches trending with genre and app name", async () => {
    mockDiscovery("https://host1/");
    mockTracksResponse();

    await fetchTrending("Electronic");

    const url = new URL((global.fetch as jest.Mock).mock.calls[1][0]);
    expect(url.pathname).toBe("/v1/tracks/trending");
    expect(url.searchParams.get("genre")).toBe("Electronic");
    expect(url.searchParams.get("app_name")).toBe("EDMM");
  });

  it("searches tracks with encoded query and app name", async () => {
    mockDiscovery("https://host1/");
    mockTracksResponse();

    const tracks = await searchAudiusTracks("lo fi");

    const requestUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
    const url = new URL(requestUrl);
    expect(url.pathname).toBe("/v1/tracks/search");
    expect(requestUrl).toContain("query=lo+fi");
    expect(url.searchParams.get("query")).toBe("lo fi");
    expect(url.searchParams.get("app_name")).toBe("EDMM");
    expect(tracks[0].id).toBe("audius:x");
  });

  it("reuses discovered host without a second discovery fetch", async () => {
    mockDiscovery();
    mockTracksResponse();
    mockTracksResponse();

    await fetchTrending();
    await fetchTrending();

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "https://api.audius.co");
    expect((global.fetch as jest.Mock).mock.calls[2][0]).toContain(
      "https://host1/v1/tracks/trending",
    );
  });

  it("rejects when host discovery returns non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(fetchTrending()).rejects.toThrow("Audius host discovery failed");
  });

  it("rejects when host discovery returns empty data", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await expect(fetchTrending()).rejects.toThrow("Audius host discovery failed");
  });

  it("rejects when host discovery returns an invalid host URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: ["not-a-url"] }),
    });

    await expect(fetchTrending()).rejects.toThrow("Audius host discovery failed");
  });

  it("rejects when trending returns non-OK response", async () => {
    mockDiscovery();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(fetchTrending()).rejects.toThrow("Audius trending failed");
  });

  it("rejects when search returns non-OK response", async () => {
    mockDiscovery();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(searchAudiusTracks("lo fi")).rejects.toThrow("Audius search failed");
  });
});
