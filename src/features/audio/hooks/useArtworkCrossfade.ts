import { useCallback, useEffect, useRef, useState } from "react";
import {
  FALLBACK_ALBUM_PALETTE,
  type AlbumColorPalette,
} from "@/features/audio/components/visualizers/albumColorPalette";

export type ArtworkLayer = {
  key: number;
  artworkSrc: string;
  hasArtwork: boolean;
  palette: AlbumColorPalette;
  opacity: number;
};

type UseArtworkCrossfadeParams = {
  artworkSrc: string;
  palette: AlbumColorPalette;
  resolvedSrc: string;
  fadeDurationMs?: number;
};

const DEFAULT_FADE_MS = 450;

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useArtworkCrossfade({
  artworkSrc,
  palette,
  resolvedSrc,
  fadeDurationMs = DEFAULT_FADE_MS,
}: UseArtworkCrossfadeParams) {
  const [layers, setLayers] = useState<ArtworkLayer[]>([]);
  const keyRef = useRef(0);

  const activateLayer = useCallback((key: number) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.key === key ? { ...layer, opacity: 1 } : layer,
      ),
    );
  }, []);

  const completeLayer = useCallback((key: number) => {
    setLayers((current) => {
      const topLayer = current[current.length - 1];
      if (!topLayer || topLayer.key !== key || topLayer.opacity !== 1) {
        return current;
      }
      return current.length === 1 ? current : [topLayer];
    });
  }, []);

  // Commit layers as the current track's palette becomes available.
  useEffect(() => {
    setLayers((current) => {
      const hasArtwork = Boolean(artworkSrc);

      // First paint: show immediately with whatever palette we have.
      if (current.length === 0) {
        return [
          { key: keyRef.current++, artworkSrc, hasArtwork, palette, opacity: 1 },
        ];
      }

      const topLayer = current[current.length - 1];

      // Same track: refine the palette in place, no crossfade.
      if (topLayer.artworkSrc === artworkSrc) {
        if (topLayer.palette === palette) {
          return current;
        }
        const next = current.slice();
        next[next.length - 1] = { ...topLayer, palette };
        return next;
      }

      // Different track: only crossfade once the new track's palette resolved.
      if (resolvedSrc !== artworkSrc) {
        return current;
      }

      const reduced = prefersReducedMotion();
      const incoming: ArtworkLayer = {
        key: keyRef.current++,
        artworkSrc,
        hasArtwork,
        palette,
        opacity: reduced ? 1 : 0,
      };

      // Cap at two layers: keep the current top as the outgoing layer. On a rapid
      // skip before the previous incoming has faded in, the still-hidden top is used
      // as the base — acceptable since the next fade quickly resolves it.
      return reduced ? [incoming] : [topLayer, incoming];
    });
  }, [artworkSrc, palette, resolvedSrc]);

  // Fallback (no artwork) layers have no image onLoad, so fade them in here.
  useEffect(() => {
    const topLayer = layers[layers.length - 1];
    if (topLayer && !topLayer.hasArtwork && topLayer.opacity === 0) {
      activateLayer(topLayer.key);
    }
  }, [layers, activateLayer]);

  // Timeout backup in case transitionend never fires.
  useEffect(() => {
    const topLayer = layers[layers.length - 1];
    if (!topLayer || layers.length === 1 || topLayer.opacity !== 1) {
      return;
    }
    const timer = setTimeout(
      () => completeLayer(topLayer.key),
      fadeDurationMs + 80,
    );
    return () => clearTimeout(timer);
  }, [layers, fadeDurationMs, completeLayer]);

  const topPalette = layers.length
    ? layers[layers.length - 1].palette
    : FALLBACK_ALBUM_PALETTE;

  return { layers, topPalette, activateLayer, completeLayer };
}
