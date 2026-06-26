import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import TrackDetailAside from "@/widgets/musicShell/trackDetailAside";
import { decodeTrackId } from "@/app/track/[id]/trackId";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

jest.mock("@/shared/db/repositories/trackCacheRepo");
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/features/audio/components/audioVisualizer", () => ({
  AudioVisualizer: () => <div>Audio visualizer</div>,
}));

const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<typeof getCachedTrack>;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

const track: Track = {
  id: "cloudinary:asset-1",
  source: "cloudinary",
  title: "Cached Track",
  artistId: "artist-1",
  artistName: "Cached Artist",
  albumName: "Cached Album",
  artworkUrl: "https://example.com/artwork.png",
  durationMs: 240000,
  streamUrl: "https://example.com/stream.mp3",
  metadata: {},
};

const mockAudioState = {
  currentTrack: {
    assetId: track.id,
    album: "Cached Album",
    name: "Cached Track",
    artworkId: "https://example.com/artwork.png",
    url: "https://example.com/stream.mp3",
    producer: "Cached Artist",
  },
  isPlaying: false,
  audioAnalyser: null,
};

describe("TrackDetailAside", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAudioPlayer.mockReturnValue(mockAudioState);
  });

  it("renders cached track details from the shell aside without lyrics", async () => {
    mockGetCachedTrack.mockResolvedValue(track);

    render(
      <TrackDetailAside
        selectedTrackId="cloudinary:asset-1"
        queue={[track]}
        onPlay={jest.fn()}
      />,
    );

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:asset-1");
    expect(await screen.findByText("Cached Track")).toBeInTheDocument();
    expect(screen.getByText("Cached Artist")).toBeInTheDocument();
    expect(screen.getByText("Cached Album")).toBeInTheDocument();
    expect(screen.getByText("4:00")).toBeInTheDocument();
    expect(screen.getByText("cloudinary")).toBeInTheDocument();
    expect(screen.getByText("Audio visualizer")).toBeInTheDocument();
  });

  it("plays the cached track with the visible queue", async () => {
    const onPlay = jest.fn();
    const queue = [track];
    mockGetCachedTrack.mockResolvedValue(track);

    render(
      <TrackDetailAside
        selectedTrackId="cloudinary:asset-1"
        queue={queue}
        onPlay={onPlay}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Play selected" }));

    expect(onPlay).toHaveBeenCalledWith(track, queue);
  });

  it("shows details unavailable when cached metadata is missing", async () => {
    mockGetCachedTrack.mockResolvedValue(undefined);

    render(<TrackDetailAside selectedTrackId="missing:track" queue={[]} />);

    expect(await screen.findByText("Details unavailable")).toBeInTheDocument();
    expect(screen.getByText(/missing:track/i)).toBeInTheDocument();
  });

  it("returns null for invalid track ids", () => {
    expect(decodeTrackId("%")).toBeNull();
  });
});
