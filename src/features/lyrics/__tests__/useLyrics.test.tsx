import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { Track } from "@/entities/track";
import { useLyrics } from "../hooks/useLyrics";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const createTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "cloudinary:asset-1",
  source: "cloudinary",
  title: "Rock & Roll / Live?",
  artistId: "artist-1",
  artistName: "A+B & Friends",
  albumName: " POP ",
  artworkUrl: "https://example.com/art.jpg",
  durationMs: 180_001,
  metadata: {},
  ...overrides,
});

const createDocument = (trackId = "cloudinary:asset-1") => ({
  trackId,
  source: "lrclib" as const,
  providerId: 42,
  instrumental: false,
  durationMs: 180_001,
  lines: [{ startMs: 1_000, endMs: 2_000, text: "Hello" }],
});

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn(async () => body),
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("useLyrics", () => {
  it.each([
    ["fullscreen is disabled", createTrack(), false, true],
    ["the caller marks the surface ineligible", createTrack(), true, false],
    [
      "the album name is missing",
      createTrack({ albumName: undefined }),
      true,
      true,
    ],
    [
      "the normalized album name is not pop",
      createTrack({ albumName: "edm" }),
      true,
      true,
    ],
    ["the id is blank", createTrack({ id: "   " }), true, true],
    ["the title is blank", createTrack({ title: "" }), true, true],
    ["the artist is blank", createTrack({ artistName: " " }), true, true],
    ["the duration is invalid", createTrack({ durationMs: 0 }), true, true],
  ])("does not fetch when %s", (_case, track, enabled, eligible) => {
    const { result } = renderHook(
      () => useLyrics(track, { enabled, eligible }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("encodes every identity parameter and exposes a validated document", async () => {
    const document = createDocument();
    mockFetch.mockResolvedValue(jsonResponse(200, document));

    const { result } = renderHook(
      () => useLyrics(createTrack(), { enabled: true, eligible: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const expected = new URLSearchParams({
      trackId: "cloudinary:asset-1",
      trackName: "Rock & Roll / Live?",
      artistName: "A+B & Friends",
      durationMs: "180001",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/lyrics?${expected.toString()}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.data).toEqual(document);
  });

  it("represents a 404 as unavailable data without retrying or erroring", async () => {
    mockFetch.mockResolvedValue(jsonResponse(404, { error: "not found" }));

    const { result } = renderHook(
      () => useLyrics(createTrack(), { enabled: true, eligible: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("uses a generic error and retries at most once for non-404 failures", async () => {
    mockFetch.mockResolvedValue(jsonResponse(503, { detail: "upstream secret" }));

    const { result } = renderHook(
      () => useLyrics(createTrack(), { enabled: true, eligible: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 3_000 },
    );

    expect(result.current.error).toEqual(new Error("Lyrics request failed"));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "a response for a different track",
      createDocument("cloudinary:some-other-track"),
    ],
    ["an invalid provider ID", { ...createDocument(), providerId: 0 }],
  ])("rejects %s", async (_case, responseDocument) => {
    mockFetch.mockResolvedValue(jsonResponse(200, responseDocument));

    const { result } = renderHook(
      () => useLyrics(createTrack(), { enabled: true, eligible: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 3_000 },
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(new Error("Lyrics request failed"));
  });

  it("never exposes a late response from the previously requested track", async () => {
    const first = deferred<ReturnType<typeof jsonResponse>>();
    const second = deferred<ReturnType<typeof jsonResponse>>();

    mockFetch.mockImplementation((input: string) =>
      input.includes("asset-1") ? first.promise : second.promise,
    );

    const { result, rerender } = renderHook(
      ({ track }) => useLyrics(track, { enabled: true, eligible: true }),
      {
        initialProps: { track: createTrack() },
        wrapper: createWrapper(),
      },
    );

    const nextTrack = createTrack({
      id: "cloudinary:asset-2",
      title: "Second song",
    });
    rerender({ track: nextTrack });

    second.resolve(
      jsonResponse(200, {
        ...createDocument("cloudinary:asset-2"),
        durationMs: nextTrack.durationMs,
      }),
    );
    await waitFor(() =>
      expect(result.current.data?.trackId).toBe("cloudinary:asset-2"),
    );

    first.resolve(jsonResponse(200, createDocument("cloudinary:asset-1")));
    await Promise.resolve();

    expect(result.current.data?.trackId).toBe("cloudinary:asset-2");
  });
});
