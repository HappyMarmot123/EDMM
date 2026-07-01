import { render, screen } from "@testing-library/react";
import * as React from "react";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import MAlbumArtwork from "@/features/audio/components/mobile/m_albumArtwork";
import type { Track } from "@/entities/track";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill,
    unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => {
    return React.createElement("img", {
      ...props,
      src: String(src),
      alt: alt ?? "",
      "data-fill": String(Boolean(fill)),
      "data-next-image": "true",
      "data-unoptimized": String(Boolean(unoptimized)),
    });
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
  it("renders dynamic Cloudinary artwork with next/image on desktop", () => {
    render(
      <AlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
      />
    );

    const image = screen.getByRole("img", { name: "Album One" });

    expect(image).toHaveAttribute("src", track.artworkUrl);
    expect(image).toHaveAttribute("data-next-image", "true");
    expect(image).toHaveAttribute("data-fill", "true");
    expect(image).toHaveAttribute("data-unoptimized", "false");
  });

  it("renders dynamic Cloudinary artwork with next/image on mobile", () => {
    render(
      <MAlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={track}
      />
    );

    const image = screen.getByRole("img", { name: "Album One" });

    expect(image).toHaveAttribute("src", track.artworkUrl);
    expect(image).toHaveAttribute("data-next-image", "true");
    expect(image).toHaveAttribute("data-fill", "true");
    expect(image).toHaveAttribute("data-unoptimized", "false");
  });

  it("falls back to unoptimized next/image for unregistered artwork hosts", () => {
    render(
      <AlbumArtwork
        isPlaying={false}
        isBuffering={false}
        currentTrackInfo={{
          ...track,
          artworkUrl: "https://example.com/art.jpg",
        }}
      />
    );

    expect(screen.getByRole("img", { name: "Album One" })).toHaveAttribute(
      "data-unoptimized",
      "true",
    );
  });
});
