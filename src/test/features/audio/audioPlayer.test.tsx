import { render, screen } from "@testing-library/react";
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

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

jest.mock("@/shared/providers/toggleProvider", () => ({
  useToggle: () => ({
    openToggle: jest.fn(),
  }),
}));

describe("AudioPlayer", () => {
  beforeEach(() => {
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
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
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
