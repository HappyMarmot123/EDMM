import { render, screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import AudioPlayer from "@/features/audio/ui/audioPlayer";
import MobileAudioPlayer from "@/features/audio/ui/mobileAudioPlayer";
import type { TrackInfo } from "@/shared/types/dataType";

const track: TrackInfo = {
  assetId: "track-1",
  album: "Album One",
  name: "Track One",
  artworkId: "https://example.com/art.jpg",
  url: "https://example.com/audio.mp3",
  producer: "Artist One",
};

type MockAudioPlayerState = {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  seek: jest.Mock;
  togglePlayPause: jest.Mock;
  nextTrack: jest.Mock;
  prevTrack: jest.Mock;
  setVolume: jest.Mock;
  setLiveVolume: jest.Mock;
  toggleMute: jest.Mock;
};

let mockAudioPlayerState: MockAudioPlayerState = {
  currentTrack: track,
  isPlaying: false,
  isBuffering: false,
  currentTime: 12,
  duration: 180,
  volume: 0.7,
  isMuted: false,
  seek: jest.fn(),
  togglePlayPause: jest.fn(),
  nextTrack: jest.fn(),
  prevTrack: jest.fn(),
  setVolume: jest.fn(),
  setLiveVolume: jest.fn(),
  toggleMute: jest.fn(),
};
const mockRouterPush = jest.fn();

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

describe("AudioPlayer", () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockAudioPlayerState = {
      currentTrack: track,
      isPlaying: false,
      isBuffering: false,
      currentTime: 12,
      duration: 180,
      volume: 0.7,
      isMuted: false,
      seek: jest.fn(),
      togglePlayPause: jest.fn(),
      nextTrack: jest.fn(),
      prevTrack: jest.fn(),
      setVolume: jest.fn(),
      setLiveVolume: jest.fn(),
      toggleMute: jest.fn(),
    };
  });

  it("pins the desktop player to the bottom and renders player controls", () => {
    render(<AudioPlayer />);

    const player = screen.getByLabelText("Audio Player");

    expect(player).toHaveAttribute("id", "player-container");
    expect(player).toHaveClass("fixed", "bottom-0", "inset-x-0");
    expect(document.getElementById("player-controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("renders desktop player content in Spotify-like track, control, and volume zones", () => {
    render(<AudioPlayer />);

    const player = screen.getByLabelText("Audio Player");
    const playerGrid = player.firstElementChild;
    const trackZone = screen.getByTestId("player-track-zone");
    const controlZone = screen.getByTestId("player-control-zone");
    const volumeZone = screen.getByTestId("player-volume-zone");
    const seekSlider = within(controlZone).getByRole("slider");
    const volumeSlider = within(volumeZone).getByRole("slider", {
      name: "Volume",
    });

    expect(playerGrid).toHaveClass(
      "grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]",
      "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.75fr)]",
      "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
    );
    expect(playerGrid?.className).not.toMatch(/minmax\(\d+px,/);
    expect(trackZone).toContainElement(
      screen.getByRole("button", { name: "Open details for Track One" })
    );
    expect(trackZone).toHaveTextContent("Track One");
    expect(trackZone).toHaveTextContent("Artist One");
    expect(controlZone).toContainElement(
      screen.getByRole("button", { name: "Play" })
    );
    expect(seekSlider).toHaveAttribute("aria-valuenow", "12");
    expect(seekSlider).toHaveAttribute("aria-valuemax", "180");
    expect(volumeZone).toHaveClass("lg:flex");
    expect(volumeSlider).toHaveValue("0.7");
  });

  it("fires previous and next actions from desktop controls", () => {
    render(<AudioPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
    fireEvent.click(screen.getByRole("button", { name: "Next track" }));

    expect(mockAudioPlayerState.prevTrack).toHaveBeenCalledTimes(1);
    expect(mockAudioPlayerState.nextTrack).toHaveBeenCalledTimes(1);
  });

  it("applies volume slider interaction to live and persisted volume", () => {
    render(<AudioPlayer />);

    const volumeSlider = screen.getByRole("slider", {
      name: "Volume",
    });

    fireEvent.change(volumeSlider, { target: { value: "0.2" } });
    fireEvent.mouseUp(volumeSlider);

    expect(mockAudioPlayerState.setLiveVolume).toHaveBeenCalledWith(0.2);
    expect(mockAudioPlayerState.setVolume).toHaveBeenCalledWith(0.2);
  });

  it("navigates to the current track detail when album artwork is clicked", () => {
    render(<AudioPlayer />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open details for Track One" })
    );

    expect(mockRouterPush).toHaveBeenCalledWith("/track/track-1");
  });

  it("does not rotate persistent desktop artwork while playback is active", () => {
    mockAudioPlayerState.isPlaying = true;

    render(<AudioPlayer />);

    expect(screen.getByAltText("Album One")).not.toHaveClass(
      "animate-rotate-album"
    );
  });

  it("keeps the desktop player visible before a track is selected", () => {
    mockAudioPlayerState.currentTrack = null;
    mockAudioPlayerState.currentTime = 0;
    mockAudioPlayerState.duration = 0;

    render(<AudioPlayer />);

    expect(screen.getByLabelText("Audio Player")).toHaveAttribute(
      "id",
      "player-container"
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeDisabled();
    fireEvent.click(playButton);
    expect(mockAudioPlayerState.togglePlayPause).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "No track artwork" })).toBeDisabled();
  });

  it("keeps the mobile player visible before a track is selected", () => {
    mockAudioPlayerState.currentTrack = null;
    mockAudioPlayerState.currentTime = 0;
    mockAudioPlayerState.duration = 0;

    render(<MobileAudioPlayer />);

    expect(screen.getByLabelText("Audio Player")).toHaveAttribute(
      "id",
      "player-container-mobile"
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });
});
