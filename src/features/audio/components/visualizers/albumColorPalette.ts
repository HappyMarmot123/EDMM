import { useEffect, useState } from "react";

export type AlbumColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
};

type PixelCandidate = {
  red: number;
  green: number;
  blue: number;
  hue: number;
  saturation: number;
  luminance: number;
};

export const FALLBACK_ALBUM_PALETTE: AlbumColorPalette = {
  primary: "253, 109, 148",
  secondary: "255, 184, 192",
  accent: "255, 154, 175",
  surface: "5, 3, 6",
};

const SAMPLE_SIZE = 44;

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toRgbString(red: number, green: number, blue: number) {
  return `${clampChannel(red)}, ${clampChannel(green)}, ${clampChannel(blue)}`;
}

function getHueDistance(firstHue: number, secondHue: number) {
  const distance = Math.abs(firstHue - secondHue);
  return Math.min(distance, 360 - distance);
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, luminance };
  }

  const saturation =
    luminance > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  let hue = 0;

  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return {
    hue: hue * 60,
    saturation,
    luminance,
  };
}

function getCandidateScore(
  candidate: PixelCandidate,
  candidates: PixelCandidate[],
) {
  const clusterSize = candidates.filter(
    (item) => getHueDistance(item.hue, candidate.hue) <= 18,
  ).length;

  return candidate.saturation * 1.7
    + candidate.luminance * 0.36
    + clusterSize * 0.35;
}

function getAccentColor(candidate: PixelCandidate) {
  return toRgbString(
    candidate.red + 35,
    candidate.green + 47,
    candidate.blue + 47,
  );
}

export function deriveAlbumPaletteFromPixels(
  pixels: Uint8ClampedArray,
): AlbumColorPalette {
  const candidates: PixelCandidate[] = [];

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 255;
    if (alpha < 128) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const { hue, saturation, luminance } = rgbToHsl(red, green, blue);

    if (saturation < 0.18 || luminance < 0.14 || luminance > 0.92) {
      continue;
    }

    candidates.push({ red, green, blue, hue, saturation, luminance });
  }

  if (candidates.length === 0) {
    return FALLBACK_ALBUM_PALETTE;
  }

  const primary = candidates.reduce((best, candidate) =>
    getCandidateScore(candidate, candidates) > getCandidateScore(best, candidates)
      ? candidate
      : best,
  );
  const secondary =
    candidates
      .filter((candidate) => getHueDistance(candidate.hue, primary.hue) >= 44)
      .sort(
        (left, right) =>
          getCandidateScore(right, candidates) - getCandidateScore(left, candidates),
      )[0] ?? primary;

  return {
    primary: toRgbString(primary.red, primary.green, primary.blue),
    secondary: toRgbString(secondary.red, secondary.green, secondary.blue),
    accent: getAccentColor(primary),
    surface: FALLBACK_ALBUM_PALETTE.surface,
  };
}

export function extractAlbumPaletteFromImageUrl(
  artworkSrc: string,
): Promise<AlbumColorPalette> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(FALLBACK_ALBUM_PALETTE);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          resolve(FALLBACK_ALBUM_PALETTE);
          return;
        }

        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const imageData = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        resolve(deriveAlbumPaletteFromPixels(imageData.data));
      } catch {
        resolve(FALLBACK_ALBUM_PALETTE);
      }
    };

    image.onerror = () => resolve(FALLBACK_ALBUM_PALETTE);
    image.src = artworkSrc;
  });
}

export function useAlbumColorPalette(artworkSrc: string) {
  const [palette, setPalette] = useState(FALLBACK_ALBUM_PALETTE);

  useEffect(() => {
    let isActive = true;

    if (!artworkSrc) {
      setPalette(FALLBACK_ALBUM_PALETTE);
      return;
    }

    extractAlbumPaletteFromImageUrl(artworkSrc).then((nextPalette) => {
      if (isActive) {
        setPalette(nextPalette);
      }
    });

    return () => {
      isActive = false;
    };
  }, [artworkSrc]);

  return palette;
}
