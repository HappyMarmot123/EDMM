import { render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track";
import MPlayerTrackDetails from "@/features/audio/components/mobile/m_playerTrackDetails";

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

describe("MPlayerTrackDetails", () => {
  it("renders the current track title and artist", () => {
    render(<MPlayerTrackDetails currentTrackInfo={track} />);

    expect(screen.getByText("Track One")).toBeInTheDocument();
    expect(screen.getByText("Artist One")).toBeInTheDocument();
  });

  it("renders fallback copy when no track is selected", () => {
    render(<MPlayerTrackDetails currentTrackInfo={null} />);

    expect(screen.getByText("No track selected")).toBeInTheDocument();
    expect(screen.getByText("Choose a song to start playback")).toBeInTheDocument();
  });
});
