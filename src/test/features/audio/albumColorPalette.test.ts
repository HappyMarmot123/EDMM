import {
  deriveAlbumPaletteFromPixels,
  FALLBACK_ALBUM_PALETTE,
} from "@/features/audio/components/visualizers/albumColorPalette";

describe("album color palette", () => {
  it("derives dominant and accent colors from saturated album pixels", () => {
    const pixels = new Uint8ClampedArray([
      220, 54, 76, 255,
      214, 48, 70, 255,
      20, 24, 34, 255,
      38, 132, 226, 255,
    ]);

    const palette = deriveAlbumPaletteFromPixels(pixels);

    expect(palette.primary).toBe("220, 54, 76");
    expect(palette.secondary).toBe("38, 132, 226");
    expect(palette.accent).toBe("255, 101, 123");
  });

  it("falls back when transparent or neutral pixels cannot produce a palette", () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 0,
      20, 20, 20, 255,
      246, 246, 246, 255,
    ]);

    expect(deriveAlbumPaletteFromPixels(pixels)).toEqual(
      FALLBACK_ALBUM_PALETTE,
    );
  });
});
