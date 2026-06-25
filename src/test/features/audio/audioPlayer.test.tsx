import { render, screen } from "@testing-library/react";
import AudioPlayer from "@/features/audio/ui/audioPlayer";
import type { TrackInfo } from "@/shared/types/dataType";

const track: TrackInfo = {
  assetId: "track-1",
  album: "Album One",
  name: "Track One",
  artworkId: "https://example.com/art.jpg",
  url: "https://example.com/audio.mp3",
  producer: "Artist One",
};

const mockAudioPlayerState = {
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
  it("pins the desktop player to the bottom and renders player controls", () => {
    render(<AudioPlayer />);

    const player = screen.getByLabelText("Audio Player");

    expect(player).toHaveAttribute("id", "player-container");
    expect(player).toHaveClass("fixed", "bottom-0", "inset-x-0");
    expect(document.getElementById("player-controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});
