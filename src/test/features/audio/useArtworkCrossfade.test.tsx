import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useArtworkCrossfade,
  type ArtworkLayer,
} from "@/features/audio/hooks/useArtworkCrossfade";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";

const paletteA = { ...FALLBACK_ALBUM_PALETTE, primary: "10, 20, 30" };
const paletteB = { ...FALLBACK_ALBUM_PALETTE, primary: "40, 50, 60" };

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

const top = (layers: ArtworkLayer[]) => layers[layers.length - 1];

describe("useArtworkCrossfade", () => {
  beforeEach(() => setMatchMedia(false));

  it("shows the first track immediately as a single opaque layer", () => {
    const { result } = renderHook(() =>
      useArtworkCrossfade({ artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "" }),
    );

    expect(result.current.layers).toHaveLength(1);
    expect(top(result.current.layers).artworkSrc).toBe("a.jpg");
    expect(top(result.current.layers).opacity).toBe(1);
  });

  it("refines the palette in place for the same track without adding a layer", () => {
    const { result, rerender } = renderHook(
      ({ palette, resolvedSrc }) =>
        useArtworkCrossfade({ artworkSrc: "a.jpg", palette, resolvedSrc }),
      { initialProps: { palette: FALLBACK_ALBUM_PALETTE, resolvedSrc: "" } },
    );

    rerender({ palette: paletteA, resolvedSrc: "a.jpg" });

    expect(result.current.layers).toHaveLength(1);
    expect(top(result.current.layers).palette).toEqual(paletteA);
  });

  it("does not swap to a new track until its palette is resolved", () => {
    const { result, rerender } = renderHook(
      ({ artworkSrc, palette, resolvedSrc }) =>
        useArtworkCrossfade({ artworkSrc, palette, resolvedSrc }),
      { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
    );

    // new track selected, but palette still resolved for the old one
    rerender({ artworkSrc: "b.jpg", palette: paletteA, resolvedSrc: "a.jpg" });

    expect(result.current.layers).toHaveLength(1);
    expect(top(result.current.layers).artworkSrc).toBe("a.jpg");
  });

  it("crossfades once the new track palette resolves, then prunes", () => {
    const { result, rerender } = renderHook(
      ({ artworkSrc, palette, resolvedSrc }) =>
        useArtworkCrossfade({ artworkSrc, palette, resolvedSrc }),
      { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
    );

    rerender({ artworkSrc: "b.jpg", palette: paletteB, resolvedSrc: "b.jpg" });

    expect(result.current.layers).toHaveLength(2);
    const incoming = top(result.current.layers);
    expect(incoming.artworkSrc).toBe("b.jpg");
    expect(incoming.opacity).toBe(0);

    act(() => result.current.activateLayer(incoming.key));
    expect(top(result.current.layers).opacity).toBe(1);

    act(() => result.current.completeLayer(incoming.key));
    expect(result.current.layers).toHaveLength(1);
    expect(top(result.current.layers).artworkSrc).toBe("b.jpg");
  });

  it("swaps instantly under prefers-reduced-motion", () => {
    setMatchMedia(true);
    const { result, rerender } = renderHook(
      ({ artworkSrc, palette, resolvedSrc }) =>
        useArtworkCrossfade({ artworkSrc, palette, resolvedSrc }),
      { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
    );

    rerender({ artworkSrc: "b.jpg", palette: paletteB, resolvedSrc: "b.jpg" });

    expect(result.current.layers).toHaveLength(1);
    expect(top(result.current.layers).artworkSrc).toBe("b.jpg");
    expect(top(result.current.layers).opacity).toBe(1);
  });

  it("auto-activates a fallback layer with no artwork after a track change", async () => {
    const { result, rerender } = renderHook(
      ({ artworkSrc, palette, resolvedSrc }) =>
        useArtworkCrossfade({ artworkSrc, palette, resolvedSrc }),
      { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
    );

    rerender({ artworkSrc: "", palette: FALLBACK_ALBUM_PALETTE, resolvedSrc: "" });

    await waitFor(() => expect(top(result.current.layers).opacity).toBe(1));
    expect(top(result.current.layers).hasArtwork).toBe(false);
  });

  it("activates a cached artwork layer via the timer fallback when onLoad never fires", () => {
    jest.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ artworkSrc, palette, resolvedSrc }) =>
          useArtworkCrossfade({ artworkSrc, palette, resolvedSrc }),
        { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
      );

      // New track's palette resolves -> incoming layer pushed at opacity 0.
      rerender({ artworkSrc: "b.jpg", palette: paletteB, resolvedSrc: "b.jpg" });
      const incoming = top(result.current.layers);
      expect(incoming.artworkSrc).toBe("b.jpg");
      expect(incoming.opacity).toBe(0);

      // Simulate a cached next/image whose onLoad never fires: do NOT call
      // activateLayer. The timer fallback must still fade the layer in.
      act(() => {
        jest.advanceTimersByTime(120);
      });

      expect(top(result.current.layers).opacity).toBe(1);
      expect(top(result.current.layers).artworkSrc).toBe("b.jpg");
    } finally {
      jest.useRealTimers();
    }
  });

  it("prunes the outgoing layer automatically after the fade duration", () => {
    jest.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ artworkSrc, palette, resolvedSrc }) =>
          useArtworkCrossfade({
            artworkSrc,
            palette,
            resolvedSrc,
            fadeDurationMs: 450,
          }),
        { initialProps: { artworkSrc: "a.jpg", palette: paletteA, resolvedSrc: "a.jpg" } },
      );

      rerender({ artworkSrc: "b.jpg", palette: paletteB, resolvedSrc: "b.jpg" });
      const incoming = top(result.current.layers);
      act(() => result.current.activateLayer(incoming.key));
      act(() => {
        jest.advanceTimersByTime(450 + 80);
      });

      expect(result.current.layers).toHaveLength(1);
      expect(top(result.current.layers).artworkSrc).toBe("b.jpg");
    } finally {
      jest.useRealTimers();
    }
  });
});
