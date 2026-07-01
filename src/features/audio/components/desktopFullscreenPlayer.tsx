import { type CSSProperties, useEffect } from "react";
import { Minimize2 } from "lucide-react";
import FullscreenArtworkStage from "@/features/audio/components/fullscreenArtworkStage";
import FullscreenAudioVisualizer from "@/features/audio/components/fullscreenAudioVisualizer";
import FullscreenBackdrop from "@/features/audio/components/fullscreenBackdrop";
import { useAlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";
import type { Track } from "@/entities/track";

type DesktopFullscreenPlayerProps = {
  currentTrackInfo: Track | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onClose: () => void;
};

const FADE_MS = 450;

export default function DesktopFullscreenPlayer({
  currentTrackInfo,
  analyser,
  isPlaying,
  onClose,
}: DesktopFullscreenPlayerProps) {
  const artworkSrc = currentTrackInfo?.artworkUrl?.trim() ?? "";
  const trackTitle = currentTrackInfo?.title ?? "No track selected";
  const { palette, resolvedSrc } = useAlbumColorPalette(artworkSrc);
  const { layers, topPalette, activateLayer, completeLayer } = useArtworkCrossfade({
    artworkSrc,
    palette,
    resolvedSrc,
    fadeDurationMs: FADE_MS,
  });

  const albumPaletteStyle = {
    "--album-primary-rgb": topPalette.primary,
    "--album-secondary-rgb": topPalette.secondary,
    "--album-accent-rgb": topPalette.accent,
  } as CSSProperties;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fadeStyle = (opacity: number): CSSProperties => ({
    opacity,
    transition: `opacity ${FADE_MS}ms ease-out`,
  });

  return (
    <section
      role="dialog"
      aria-label="Fullscreen player"
      className="fixed inset-0 z-[60] min-h-screen min-h-dvh overflow-hidden bg-[#050306] text-white"
      style={albumPaletteStyle}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[#050306]" />

      {layers.map((layer) => (
        <div
          key={layer.key}
          aria-hidden="true"
          className="absolute inset-0"
          style={fadeStyle(layer.opacity)}
        >
          <FullscreenBackdrop
            artworkSrc={layer.artworkSrc}
            hasArtwork={layer.hasArtwork}
            palette={layer.palette}
          />
        </div>
      ))}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.20),rgba(0,0,0,0.50)_54%,rgba(0,0,0,0.82))]"
      />

      <div
        aria-hidden="true"
        aria-label="liquid-glass-panel"
        className="liquid-glass-panel absolute inset-x-10 top-8 h-[calc(100%-150px)] overflow-hidden rounded-[42px] border border-white/[0.055] bg-white/[0.018] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_60px_160px_rgba(0,0,0,0.24)]"
      >
        <div className="absolute inset-x-[-2.5rem] bottom-0 top-[10%] overflow-hidden">
          <FullscreenAudioVisualizer
            analyser={analyser}
            isActive={isPlaying}
            isCurrentTrack={Boolean(currentTrackInfo)}
            palette={topPalette}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Exit fullscreen view"
        title="Exit fullscreen view"
        className="group absolute right-8 top-8 z-[2] grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-black/38 text-white/78 backdrop-blur-md transition-colors hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Minimize2 size={21} strokeWidth={2.3} aria-hidden="true" />
        <span className="pointer-events-none absolute right-0 top-[calc(100%+10px)] whitespace-nowrap rounded-md border border-white/10 bg-black/76 px-3 py-1.5 text-xs font-bold text-white/82 opacity-0 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Exit fullscreen
        </span>
      </button>

      <div className="relative z-[1] flex min-h-screen min-h-dvh flex-col items-center justify-center px-12 pb-[calc(130px+max(env(safe-area-inset-bottom),12px))] pt-20">
        <div className="grid w-full max-w-[560px] justify-items-center">
          <div className="relative">
            {layers.map((layer, index) => {
              const isTop = index === layers.length - 1;
              return (
                <div
                  key={layer.key}
                  className={isTop ? "" : "absolute inset-0"}
                  style={fadeStyle(layer.opacity)}
                  onTransitionEnd={(event) => {
                    if (
                      event.propertyName === "opacity" &&
                      event.target === event.currentTarget
                    ) {
                      completeLayer(layer.key);
                    }
                  }}
                >
                  <FullscreenArtworkStage
                    artworkSrc={layer.artworkSrc}
                    trackTitle={trackTitle}
                    hasArtwork={layer.hasArtwork}
                    isPlaying={isPlaying}
                    palette={layer.palette}
                    onArtworkLoad={() => activateLayer(layer.key)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
