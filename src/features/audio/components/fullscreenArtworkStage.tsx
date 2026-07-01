import Image from "next/image";
import { Music2 } from "lucide-react";
import { shouldUnoptimizeArtworkImage } from "@/features/audio/components/artworkImage";
import FullscreenAlbumDisc from "@/features/audio/components/fullscreenAlbumDisc";
import type { AlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";

type FullscreenArtworkStageProps = {
  artworkSrc: string;
  trackTitle: string;
  hasArtwork: boolean;
  isPlaying: boolean;
  palette: AlbumColorPalette;
  onArtworkLoad?: () => void;
};

export default function FullscreenArtworkStage({
  artworkSrc,
  trackTitle,
  hasArtwork,
  isPlaying,
  palette,
  onArtworkLoad,
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
          <Image
            src={artworkSrc}
            alt={`${trackTitle} fullscreen artwork`}
            fill
            sizes="(min-width: 1024px) 400px, 42vw"
            unoptimized={shouldUnoptimizeArtworkImage(artworkSrc)}
            className="object-cover"
            draggable={false}
            onLoad={() => onArtworkLoad?.()}
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
