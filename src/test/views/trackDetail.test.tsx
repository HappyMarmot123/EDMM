import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";
import { TrackDetailView } from "@/views/trackDetail";
import { decodeTrackId } from "@/app/track/[id]/trackId";

jest.mock("@/shared/db/repositories/trackCacheRepo");
jest.mock("@/features/lyrics/hooks/useLyrics");

const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<typeof getCachedTrack>;
const mockUseLyrics = useLyrics as jest.MockedFunction<typeof useLyrics>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("TrackDetailView", () => {
  const track: Track = {
    id: "audius:1",
    source: "audius",
    title: "Track One",
    artistId: "artist-1",
    artistName: "Artist One",
    albumName: "Album One",
    artworkUrl: "https://example.com/artwork.png",
    durationMs: 240000,
    streamUrl: "https://example.com/stream.mp3",
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders track title and lyrics", async () => {
    mockGetCachedTrack.mockResolvedValue(track);
    mockUseLyrics.mockReturnValue({
      data: "Some lyrics for the song",
    } as ReturnType<typeof useLyrics>);

    render(<TrackDetailView trackId="audius:1" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText("Track One")).toBeInTheDocument();
    expect(screen.getByText("Artist One")).toBeInTheDocument();
    expect(screen.getByText("Some lyrics for the song")).toBeInTheDocument();
    expect(mockUseLyrics).toHaveBeenCalledWith("Artist One", "Track One");
  });

  it("shows fallback when lyrics are unavailable", async () => {
    mockGetCachedTrack.mockResolvedValue(track);
    mockUseLyrics.mockReturnValue({
      data: null,
    } as ReturnType<typeof useLyrics>);

    render(<TrackDetailView trackId="audius:1" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText("Track One")).toBeInTheDocument();
    expect(screen.getByText("No lyrics available.")).toBeInTheDocument();
  });

  it("renders not-found message when track is missing", async () => {
    mockGetCachedTrack.mockResolvedValue(undefined);
    mockUseLyrics.mockReturnValue({ data: null } as ReturnType<typeof useLyrics>);

    render(<TrackDetailView trackId="missing:track" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText(/no track details found/i)).toBeInTheDocument();
  });

  it("returns null for invalid track ids", () => {
    expect(decodeTrackId("%")).toBeNull();
  });
});
