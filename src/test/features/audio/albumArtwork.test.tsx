import { render, screen } from "@testing-library/react";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import MAlbumArtwork from "@/features/audio/components/mobile/m_albumArtwork";
import type { Track } from "@/entities/track/model";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => {
    throw new Error("Player artwork must not use next/image for dynamic CDN URLs");
  },
}));

const track: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl:
    "https://res.cloudinary.com/demo/image/upload/v1719000000/cloudinary-cover.jpg",
  durationMs: 180000,
  streamUrl: "/stream/track-1",
  metadata: {},
};

describe("AlbumArtwork", () => {
  it("renders dynamic Cloudinary artwork with a native image on desktop", () => {
    render(
      <AlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
      />
    );

    expect(screen.getByRole("img", { name: "Album One" })).toHaveAttribute(
      "src",
      track.artworkUrl
    );
  });

  it("renders dynamic Cloudinary artwork with a native image on mobile", () => {
    render(
      <MAlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
      />
    );

    expect(screen.getByRole("img", { name: "Album One" })).toHaveAttribute(
      "src",
      track.artworkUrl
    );
  });
});
