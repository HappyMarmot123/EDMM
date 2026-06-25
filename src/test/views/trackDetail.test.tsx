import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { TrackDetailView } from "@/views/trackDetail";
import { decodeTrackId } from "@/app/track/[id]/trackId";
import { fireEvent } from "@testing-library/react";

jest.mock("@/shared/db/repositories/trackCacheRepo");
jest.mock("@/features/lyrics/hooks/useLyrics");
jest.mock("@/shared/providers/audioPlayerProvider");

const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<typeof getCachedTrack>;
const mockUseLyrics = useLyrics as jest.MockedFunction<typeof useLyrics>;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

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
    mockUseAudioPlayer.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      volume: 1,
      isMuted: false,
      audioInstance: null,
      audioContext: null,
      audioAnalyser: null,
      cleanAudioInstance: jest.fn(),
      setTrack: jest.fn(),
      playTrack: jest.fn(),
      handleSelectTrack: jest.fn(),
      togglePlayPause: jest.fn(),
      setIsPlaying: jest.fn(),
      setCurrentTime: jest.fn(),
      setDuration: jest.fn(),
      setIsBuffering: jest.fn(),
      setVolume: jest.fn(),
      toggleMute: jest.fn(),
      seekTo: jest.fn(),
      seek: jest.fn(),
      nextTrack: jest.fn(),
      prevTrack: jest.fn(),
      setLiveVolume: jest.fn(),
    });
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
    expect(screen.getByText("Album One")).toBeInTheDocument();
    expect(screen.getByText("4:00")).toBeInTheDocument();
    expect(screen.getByText("Audio visualizer")).toBeInTheDocument();
    expect(screen.getByText("Some lyrics for the song")).toBeInTheDocument();
    expect(mockUseLyrics).toHaveBeenCalledWith("Artist One", "Track One");
  });

  it("plays the loaded track from the detail hero", async () => {
    const onPlay = jest.fn();
    mockGetCachedTrack.mockResolvedValue(track);
    mockUseLyrics.mockReturnValue({
      data: null,
    } as ReturnType<typeof useLyrics>);

    render(<TrackDetailView trackId="audius:1" onPlay={onPlay} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(await screen.findByRole("button", { name: "Play" }));

    expect(onPlay).toHaveBeenCalledWith(track);
  });

  it("marks the visualizer live for the current playing track", async () => {
    mockGetCachedTrack.mockResolvedValue(track);
    mockUseLyrics.mockReturnValue({
      data: null,
    } as ReturnType<typeof useLyrics>);
    mockUseAudioPlayer.mockReturnValue({
      ...mockUseAudioPlayer(),
      currentTrack: {
        assetId: "audius:1",
        album: "Album One",
        name: "Track One",
        artworkId: "https://example.com/artwork.png",
        url: "https://example.com/stream.mp3",
        producer: "Artist One",
      },
      isPlaying: true,
    });

    render(<TrackDetailView trackId="audius:1" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText("Live audio visualizer")).toBeInTheDocument();
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
