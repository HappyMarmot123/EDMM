import { renderHook, waitFor } from "@testing-library/react";
import {
  useAlbumColorPalette,
  FALLBACK_ALBUM_PALETTE,
} from "@/features/audio/components/visualizers/albumColorPalette";

class FakeImage {
  crossOrigin = "";
  decoding = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    Promise.resolve().then(() => this.onload?.());
  }
}

describe("useAlbumColorPalette", () => {
  const OriginalImage = global.Image;

  beforeEach(() => {
    (global as unknown as { Image: unknown }).Image = FakeImage;
  });

  afterEach(() => {
    (global as unknown as { Image: unknown }).Image = OriginalImage;
  });

  it("starts with an empty resolvedSrc and the fallback palette", () => {
    const { result } = renderHook(() => useAlbumColorPalette("https://cdn/a.jpg"));

    expect(result.current.resolvedSrc).toBe("");
    expect(result.current.palette).toEqual(FALLBACK_ALBUM_PALETTE);
  });

  it("reports the resolved src once extraction completes", async () => {
    const { result } = renderHook(() => useAlbumColorPalette("https://cdn/a.jpg"));

    await waitFor(() =>
      expect(result.current.resolvedSrc).toBe("https://cdn/a.jpg"),
    );
  });

  it("resets to empty resolvedSrc when the src is cleared", () => {
    const { result } = renderHook(() => useAlbumColorPalette(""));

    expect(result.current.resolvedSrc).toBe("");
    expect(result.current.palette).toEqual(FALLBACK_ALBUM_PALETTE);
  });
});
