import { render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track";
import type { SyncedLyricsDocument } from "@/shared/lib/lyrics";
import FullscreenLyricsExperience from "../components/fullscreenLyricsExperience";
import { useLyrics } from "../hooks/useLyrics";

jest.mock("../hooks/useLyrics", () => ({
  useLyrics: jest.fn(),
}));

const mockUseLyrics = useLyrics as jest.MockedFunction<typeof useLyrics>;

const track: Track = {
  id: "cloudinary:pop-1",
  source: "cloudinary",
  title: "Pop One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "pop",
  artworkUrl: "https://example.com/pop.jpg",
  durationMs: 180_000,
  streamUrl: "https://example.com/pop.mp3",
  metadata: {},
};

const lyricsDocument: SyncedLyricsDocument = {
  trackId: track.id,
  source: "lrclib",
  providerId: 42,
  instrumental: false,
  durationMs: track.durationMs,
  lines: [{ startMs: 1_000, endMs: 3_000, text: "First lyric" }],
};

const queryResult = (
  overrides: Partial<ReturnType<typeof useLyrics>>,
): ReturnType<typeof useLyrics> =>
  ({
    isPending: false,
    isError: false,
    data: lyricsDocument,
    ...overrides,
  }) as ReturnType<typeof useLyrics>;

describe("FullscreenLyricsExperience", () => {
  beforeEach(() => {
    mockUseLyrics.mockReset();
  });

  it.each([
    [
      "loading",
      queryResult({ isPending: true, data: undefined }),
      "Loading synchronized lyrics…",
    ],
    [
      "unavailable",
      queryResult({ data: null }),
      "Synced lyrics aren’t available for this track.",
    ],
    [
      "error",
      queryResult({ isError: true, data: undefined }),
      "Lyrics couldn’t be loaded. Playback is still available.",
    ],
  ])("maps %s query state into the shared panel", (_case, result, copy) => {
    mockUseLyrics.mockReturnValue(result);

    render(
      <FullscreenLyricsExperience
        track={track}
        currentTimeSeconds={1.5}
      />,
    );

    expect(mockUseLyrics).toHaveBeenCalledWith(track, {
      enabled: true,
      eligible: true,
    });
    expect(screen.getByText(copy)).toBeInTheDocument();
  });

  it("passes successful and instrumental documents through to the panel", () => {
    mockUseLyrics.mockReturnValue(
      queryResult({
        data: { ...lyricsDocument, instrumental: true, lines: [] },
      }),
    );

    const { rerender } = render(
      <FullscreenLyricsExperience
        track={track}
        currentTimeSeconds={1.5}
        className="mobile-height"
      />,
    );

    expect(screen.getByText("Instrumental track")).toBeInTheDocument();
    expect(screen.getByLabelText("Synchronized lyrics")).toHaveClass(
      "mobile-height",
    );

    mockUseLyrics.mockReturnValue(queryResult({ data: lyricsDocument }));
    rerender(
      <FullscreenLyricsExperience
        track={track}
        currentTimeSeconds={1.5}
      />,
    );

    expect(screen.getByText("First lyric")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
