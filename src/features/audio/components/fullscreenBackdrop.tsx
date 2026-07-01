/* eslint-disable @next/next/no-img-element -- Fullscreen artwork receives dynamic CDN hosts. */
import type { AlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";

type FullscreenBackdropProps = {
  artworkSrc: string;
  hasArtwork: boolean;
  palette: AlbumColorPalette;
};

export default function FullscreenBackdrop({
  artworkSrc,
  hasArtwork,
  palette,
}: FullscreenBackdropProps) {
  return (
    <>
      {hasArtwork ? (
        <>
          <img
            src={artworkSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-[-18%] h-[136%] w-[136%] scale-105 object-cover opacity-42 blur-[72px] saturate-[1.28]"
            draggable={false}
          />
          <img
            src={artworkSrc}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-[43%] h-[56vmin] w-[56vmin] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-24 blur-[92px] saturate-[1.55]"
            draggable={false}
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[43%] h-[56vmin] w-[56vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{ background: `rgba(${palette.primary}, 0.20)` }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 34%, rgba(${palette.accent}, 0.16), rgba(${palette.primary}, 0.12) 26%, rgba(5, 3, 6, 0.90) 74%, rgba(0, 0, 0, 0.98) 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[9vw] bottom-[calc(122px+max(env(safe-area-inset-bottom),12px))] h-36 rounded-full opacity-70 blur-3xl"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, rgba(${palette.secondary}, 0.12), rgba(${palette.accent}, 0.16), rgba(${palette.primary}, 0.12), transparent)`,
        }}
      />
    </>
  );
}
