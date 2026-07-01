import { render, screen } from "@testing-library/react";
import MPlayerControlsSection from "@/features/audio/components/mobile/m_playerControlsSection";
import type { Track } from "@/entities/track/model";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    togglePlayPause: jest.fn(),
    nextTrack: jest.fn(),
    prevTrack: jest.fn(),
  }),
}));

const track: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album",
  artworkUrl: "https://example.com/art.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/audio.mp3",
  metadata: {},
};

describe("MPlayerControlsSection", () => {
  it("uses the mobile player-controls container id", () => {
    render(<MPlayerControlsSection currentTrackInfo={track} />);

    expect(screen.getByLabelText("Track One controls")).toHaveAttribute(
      "id",
      "player-controls-mobile"
    );
  });
});
