import {
  LyricsProviderError,
  findLrclibLyrics,
} from "../lrclibClient";

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

const candidate = (
  overrides: Partial<{
    id: number;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    instrumental: boolean;
    syncedLyrics: string | null;
  }> = {},
) => ({
  id: 10,
  trackName: "Synthetic Song",
  artistName: "Synthetic Artist",
  albumName: "Synthetic Album",
  duration: 180,
  instrumental: false,
  syncedLyrics: "[00:01.00]Synthetic line",
  ...overrides,
});

beforeEach(() => {
  mockFetch.mockReset();
});

it("searches LRCLIB by track and artist without sending lyric text", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [candidate()],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ providerId: 10 });

  const url = new URL(mockFetch.mock.calls[0][0].toString());
  expect(url.origin + url.pathname).toBe("https://lrclib.net/api/search");
  expect(url.searchParams.get("track_name")).toBe("Synthetic Song");
  expect(url.searchParams.get("artist_name")).toBe("Synthetic Artist");
  expect(mockFetch.mock.calls[0][1]).toMatchObject({
    cache: "force-cache",
    headers: {
      Accept: "application/json",
      "User-Agent":
        "EDMM/0.1.0 (https://github.com/HappyMarmot123/EDMM)",
    },
    next: { revalidate: 86_400 },
  });
  expect(mockFetch.mock.calls[0][1].signal).toBeDefined();
});

it("normalizes title punctuation/case and accepts an exact artist", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      candidate({ trackName: "SYNTHETIC—SONG!", artistName: "synthetic artist" }),
    ],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ providerId: 10 });
});

it("accepts a normalized partial artist match in either direction", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [candidate({ artistName: "Synthetic Artist feat. Guest" })],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ providerId: 10 });
});

it("does not treat an artist-name substring inside another token as a match", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [candidate({ artistName: "FIVE" })],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "IVE",
      durationMs: 180_000,
    }),
  ).resolves.toBeNull();
});

it("rejects a different title or unrelated artist", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      candidate({ id: 1, trackName: "Another Song" }),
      candidate({ id: 2, artistName: "Unrelated Performer" }),
    ],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toBeNull();
});

it("accepts a duration difference of exactly two seconds", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [candidate({ duration: 182 })],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ providerId: 10 });
});

it("rejects a duration difference over two seconds", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [candidate({ duration: 182.001 })],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toBeNull();
});

it("selects the closest-duration eligible candidate deterministically", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      candidate({ id: 30, duration: 181.5 }),
      candidate({ id: 20, duration: 180.2, artistName: "Synthetic Artist & Guest" }),
      candidate({ id: 10, duration: 180.2 }),
    ],
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ providerId: 10 });
});

it("requires synced lyrics for vocal candidates but preserves instrumental matches", async () => {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [candidate({ syncedLyrics: null })],
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [candidate({ instrumental: true, syncedLyrics: null })],
    });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toBeNull();
  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).resolves.toMatchObject({ instrumental: true, syncedLyrics: null });
});

it.each([
  ["a non-OK response", { ok: false, status: 503 }],
  ["invalid JSON shape", { ok: true, json: async () => ({ results: [] }) }],
])("throws a provider error for %s", async (_case, response) => {
  mockFetch.mockResolvedValueOnce(response);

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).rejects.toBeInstanceOf(LyricsProviderError);
});

it("wraps an aborted request as a provider error", async () => {
  mockFetch.mockRejectedValueOnce(new Error("request failed"));

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).rejects.toBeInstanceOf(LyricsProviderError);
});

it("wraps invalid upstream JSON as a provider error", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => {
      throw new SyntaxError("private response detail");
    },
  });

  await expect(
    findLrclibLyrics({
      trackName: "Synthetic Song",
      artistName: "Synthetic Artist",
      durationMs: 180_000,
    }),
  ).rejects.toBeInstanceOf(LyricsProviderError);
});
