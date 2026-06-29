import { render, screen } from "@testing-library/react";
import MPlayerControlsSection from "@/features/audio/components/mobile/m_playerControlsSection";
import type { TrackInfo } from "@/shared/types/dataType";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    togglePlayPause: jest.fn(),
    nextTrack: jest.fn(),
    prevTrack: jest.fn(),
  }),
}));

const track: TrackInfo = {
  assetId: "track-1",
  album: "Album",
  name: "Track One",
  artworkId: "https://example.com/art.jpg",
  url: "https://example.com/audio.mp3",
  producer: "Artist One",
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
