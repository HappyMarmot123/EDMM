/* eslint-disable @next/next/no-img-element -- Fullscreen artwork is a fixed size that changes on every track; next/image's optimization/caching add no value here, and its onLoad is unreliable for already-cached images. A raw <img> shares the same cache entry as the backdrop and palette extractor. */
import { Music2 } from "lucide-react";
import FullscreenAlbumDisc from "@/features/audio/components/fullscreenAlbumDisc";
import type { AlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";

type FullscreenArtworkStageProps = {
  artworkSrc: string;
  trackTitle: string;
  hasArtwork: boolean;
  isPlaying: boolean;
  palette: AlbumColorPalette;
};

export default function FullscreenArtworkStage({
  artworkSrc,
  trackTitle,
  hasArtwork,
  isPlaying,
  palette,
}: FullscreenArtworkStageProps) {
  return (
    <div className="relative">
      <FullscreenAlbumDisc
        artworkSrc={artworkSrc}
        trackTitle={trackTitle}
        isPlaying={isPlaying}
      />
      <div
        className="relative z-[1] aspect-square w-[min(42vw,400px)] overflow-hidden rounded-xl bg-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.58)] ring-1 ring-white/12"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% 0, 60% 50%, 100% 100%, 100% 100%, 0 100%)",
        }}
      >
        {hasArtwork ? (
          <img
            src={artworkSrc}
            alt={`${trackTitle} fullscreen artwork`}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(${palette.primary}, 0.22), rgba(255, 255, 255, 0.06))`,
              color: `rgb(${palette.accent})`,
            }}
          >
            <Music2 size={96} strokeWidth={1.4} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
