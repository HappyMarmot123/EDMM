import { act, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track";
import { getCachedTrack } from "@/shared/db";
import TrackDetailAside from "@/widgets/musicShell/trackDetailAside";
import { decodeTrackId } from "@/app/track/[id]/trackId";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

jest.mock("@/shared/db");
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/features/audio", () => ({
  AudioVisualizer: ({ isActive }: { isActive: boolean }) => (
    <div
      data-active={String(isActive)}
      data-testid="track-detail-audio-visualizer"
    >
      Audio visualizer
    </div>
  ),
  EqualizerPanel: () => <div>Equalizer panel</div>,
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
  currentTrack: track,
  isPlaying: false,
  audioAnalyser: null,
  duration: 240,
} as unknown as ReturnType<typeof useAudioPlayer>;

describe("TrackDetailAside", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAudioPlayer.mockReturnValue(mockAudioState);
  });

  it("renders cached track details from the shell aside without lyrics", async () => {
    mockGetCachedTrack.mockResolvedValue(track);

    render(
      <TrackDetailAside activeView="all" selectedTrackId="cloudinary:asset-1" />,
    );

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:asset-1");
    expect(await screen.findByText("Cached Track")).toBeInTheDocument();
    expect(screen.getByText("Cached Artist")).toBeInTheDocument();
    expect(screen.getByText("4:00")).toBeInTheDocument();
    expect(screen.getByText("cloudinary")).toBeInTheDocument();
    expect(screen.getByText("Audio visualizer")).toBeInTheDocument();
  });

  it("does not render a play/pause control in the aside", async () => {
    mockGetCachedTrack.mockResolvedValue(track);

    render(
      <TrackDetailAside activeView="all" selectedTrackId="cloudinary:asset-1" />,
    );

    expect(await screen.findByText("Cached Track")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(play|pause) /i }),
    ).not.toBeInTheDocument();
  });

  it("pauses the aside visualizer while the player fullscreen surface is open", async () => {
    mockGetCachedTrack.mockResolvedValue(track);
    mockUseAudioPlayer.mockReturnValue({
      ...mockAudioState,
      isPlaying: true,
      audioAnalyser: {} as AnalyserNode,
    });

    render(
      <TrackDetailAside activeView="all" selectedTrackId="cloudinary:asset-1" />,
    );

    expect(await screen.findByTestId("track-detail-title")).toBeInTheDocument();
    expect(screen.getByTestId("track-detail-audio-visualizer")).toHaveAttribute(
      "data-active",
      "true",
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent("edmm:player-fullscreen-state-change", {
          detail: { isOpen: true },
        }),
      );
    });

    expect(screen.getByTestId("track-detail-audio-visualizer")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("shows details unavailable when cached metadata is missing", async () => {
    mockGetCachedTrack.mockResolvedValue(undefined);

    render(<TrackDetailAside activeView="all" selectedTrackId="missing:track" />);

    expect(
      await screen.findByText("선택한 정보를 불러올 수 없습니다"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/목록에서 다른 트랙을 선택해 주세요/i),
    ).toBeInTheDocument();
  });

  it("returns null for invalid track ids", () => {
    expect(decodeTrackId("%")).toBeNull();
  });
});
