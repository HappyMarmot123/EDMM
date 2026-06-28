import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/Track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import {
  getCachedTrack,
  getCachedTracks,
} from "@/shared/db/repositories/trackCacheRepo";
import { SearchView } from "@/views/search";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

jest.mock("@/features/cloudinary/hooks/useCloudinaryTracks");
jest.mock("@/features/library/hooks/useRecentPlays");
jest.mock("@/shared/db/repositories/trackCacheRepo");
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/features/audio/components/audioVisualizer", () => ({
  AudioVisualizer: () => <div>Audio visualizer</div>,
}));

const mockUseCloudinaryTracks = useCloudinaryTracks as jest.Mock;
const mockUseRecentPlays = useRecentPlays as jest.Mock;
const mockGetCachedTracks = getCachedTracks as jest.MockedFunction<
  typeof getCachedTracks
>;
const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<
  typeof getCachedTrack
>;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

const wrapperTrack: Track = {
  id: "cloudinary:search-wrapper",
  source: "cloudinary",
  title: "Wrapper Track",
  artistId: "cloudinary:artist",
  artistName: "EDMM",
  albumName: "Shell",
  artworkUrl: "",
  durationMs: 180000,
  streamUrl: "https://example.com/wrapper.mp3",
  metadata: {},
};
const recentTrack: Track = {
  ...wrapperTrack,
  id: "cloudinary:recent-1",
  title: "Search Recent Track",
  streamUrl: "https://example.com/recent.mp3",
};
const deepLinkedTrack: Track = {
  ...wrapperTrack,
  id: "cloudinary:asset-1",
  title: "Cached Deep Link Track",
  streamUrl: "https://example.com/deep-link.mp3",
};

describe("SearchView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAudioPlayer.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      isBuffering: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      queue: [],
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
    mockUseCloudinaryTracks.mockReturnValue({
      data: [wrapperTrack],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });
    mockGetCachedTracks.mockResolvedValue([]);
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [wrapperTrack, recentTrack, deepLinkedTrack].find((track) => track.id === trackId),
    );
  });

  it("renders the unified music shell heading", () => {
    render(<SearchView />);

    expect(
      screen.getByRole("heading", { name: "EDMM" }),
    ).toBeInTheDocument();
  });

  it("passes play events through the shell", () => {
    const onPlay = jest.fn();

    render(<SearchView onPlay={onPlay} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Wrapper Track" }));

    expect(onPlay).toHaveBeenCalledWith(wrapperTrack, [wrapperTrack], true);
  });

  it("starts on the Recent view from prop", async () => {
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<SearchView initialView="recent" />);

    expect(screen.getByRole("button", { name: "Recent" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByText("Search Recent Track")).toBeInTheDocument();
  });

  it("opens cached track details from initialTrackId", async () => {
    render(<SearchView initialTrackId="cloudinary:asset-1" />);

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:asset-1");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cached Deep Link Track",
    );
  });
});
