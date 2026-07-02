import { render } from "@testing-library/react";
import FullscreenBackdrop from "@/features/audio/components/fullscreenBackdrop";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";

describe("FullscreenBackdrop", () => {
  it("renders blurred artwork images when artwork is present", () => {
    const { container } = render(
      <FullscreenBackdrop
        artworkSrc="https://cdn/a.jpg"
        hasArtwork
        palette={FALLBACK_ALBUM_PALETTE}
      />,
    );

    const images = container.querySelectorAll('img[src="https://cdn/a.jpg"]');
    expect(images).toHaveLength(2);
  });

  it("renders a palette glow instead of images when artwork is absent", () => {
    const { container } = render(
      <FullscreenBackdrop
        artworkSrc=""
        hasArtwork={false}
        palette={FALLBACK_ALBUM_PALETTE}
      />,
    );

    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});
