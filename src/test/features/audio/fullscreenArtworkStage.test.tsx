import { render, screen } from "@testing-library/react";
import FullscreenArtworkStage from "@/features/audio/components/fullscreenArtworkStage";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";

describe("FullscreenArtworkStage", () => {
  it("renders the main artwork image with an accessible alt", () => {
    render(
      <FullscreenArtworkStage
        artworkSrc="https://cdn/a.jpg"
        trackTitle="Night Drive"
        hasArtwork
        isPlaying={false}
        palette={FALLBACK_ALBUM_PALETTE}
      />,
    );

    expect(
      screen.getByAltText("Night Drive fullscreen artwork"),
    ).toBeInTheDocument();
  });

  it("renders a fallback icon when there is no artwork", () => {
    const { container } = render(
      <FullscreenArtworkStage
        artworkSrc=""
        trackTitle="No track selected"
        hasArtwork={false}
        isPlaying={false}
        palette={FALLBACK_ALBUM_PALETTE}
      />,
    );

    expect(
      container.querySelector('[alt="No track selected fullscreen artwork"]'),
    ).toBeNull();
  });
});
