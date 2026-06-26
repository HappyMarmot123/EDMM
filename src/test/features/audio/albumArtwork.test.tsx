import { render, screen } from "@testing-library/react";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import MAlbumArtwork from "@/features/audio/components/mobile/m_albumArtwork";
import type { TrackInfo } from "@/shared/types/dataType";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => {
    throw new Error("Player artwork must not use next/image for dynamic CDN URLs");
  },
}));

const track: TrackInfo = {
  assetId: "track-1",
  album: "Album One",
  name: "Track One",
  artworkId:
    "https://res.cloudinary.com/demo/image/upload/v1719000000/cloudinary-cover.jpg",
  url: "/stream/track-1",
  producer: "Artist One",
};

describe("AlbumArtwork", () => {
  it("renders dynamic Cloudinary artwork with a native image on desktop", () => {
    render(
      <AlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByRole("img", { name: "Album One" })).toHaveAttribute(
      "src",
      track.artworkId
    );
  });

  it("renders dynamic Cloudinary artwork with a native image on mobile", () => {
    render(
      <MAlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByRole("img", { name: "Album One" })).toHaveAttribute(
      "src",
      track.artworkId
    );
  });
});
