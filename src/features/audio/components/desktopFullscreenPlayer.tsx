/* eslint-disable @next/next/no-img-element -- Fullscreen artwork receives dynamic CDN hosts. */
import { type CSSProperties, useEffect } from "react";
import { Minimize2, Music2 } from "lucide-react";
import FullscreenAlbumDisc from "@/features/audio/components/fullscreenAlbumDisc";
import FullscreenAudioVisualizer from "@/features/audio/components/fullscreenAudioVisualizer";
import { useAlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";
import type { TrackInfo } from "@/shared/types/dataType";

type DesktopFullscreenPlayerProps = {
  currentTrackInfo: TrackInfo | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onClose: () => void;
};

export default function DesktopFullscreenPlayer({
  currentTrackInfo,
  analyser,
  isPlaying,
  onClose,
}: DesktopFullscreenPlayerProps) {
  const artworkSrc = currentTrackInfo?.artworkId?.trim() ?? "";
  const trackTitle = currentTrackInfo?.name ?? "No track selected";
  const hasArtwork = Boolean(artworkSrc);
  const albumPalette = useAlbumColorPalette(artworkSrc);
  const albumPaletteStyle = {
    "--album-primary-rgb": albumPalette.primary,
    "--album-secondary-rgb": albumPalette.secondary,
    "--album-accent-rgb": albumPalette.accent,
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <section
      role="dialog"
      aria-label="Fullscreen player"
      className="fixed inset-0 z-[60] min-h-dvh overflow-hidden bg-[#050306] text-white"
      style={albumPaletteStyle}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#050306]"
      />
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
          className="absolute left-1/2 top-[43%] h-[56vmin] w-[56vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fd6d94]/20 blur-[100px]"
          style={{
            background: `rgba(${albumPalette.primary}, 0.20)`,
          }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.14),rgba(8,8,8,0.42)_30%,rgba(5,3,6,0.90)_74%,rgba(0,0,0,0.98)_100%)]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 34%, rgba(${albumPalette.accent}, 0.16), rgba(${albumPalette.primary}, 0.12) 26%, rgba(5, 3, 6, 0.90) 74%, rgba(0, 0, 0, 0.98) 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.20),rgba(0,0,0,0.50)_54%,rgba(0,0,0,0.82))]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[9vw] bottom-[calc(122px+max(env(safe-area-inset-bottom),12px))] h-36 rounded-full bg-[linear-gradient(90deg,transparent,rgba(253,109,148,0.13),rgba(255,255,255,0.10),rgba(253,109,148,0.12),transparent)] opacity-70 blur-3xl"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, rgba(${albumPalette.secondary}, 0.12), rgba(${albumPalette.accent}, 0.16), rgba(${albumPalette.primary}, 0.12), transparent)`,
        }}
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
            palette={albumPalette}
          />
        </div>
      </div>
      {/* <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:88px_88px]"
      /> */}

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

      <div className="relative z-[1] flex min-h-dvh flex-col items-center justify-center px-12 pb-[calc(130px+max(env(safe-area-inset-bottom),12px))] pt-20">
        <div className="grid w-full max-w-[560px] justify-items-center">
          <div className="relative">
            <FullscreenAlbumDisc
              artworkSrc={artworkSrc}
              trackTitle={trackTitle}
              isPlaying={isPlaying}
            />
            <div
              className="relative z-[1] aspect-square w-[min(42vw,400px)] overflow-hidden rounded-xl bg-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.58)] ring-1 ring-white/12"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% 0, 60% 50%, 100% 100%, 100% 100%, 0 100%)",
              }}
            >
            {hasArtwork ? (
              <img
                src={artworkSrc}
                alt={`${trackTitle} fullscreen artwork`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(253,109,148,0.22),rgba(255,255,255,0.06))] text-[#fd6d94]"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(${albumPalette.primary}, 0.22), rgba(255, 255, 255, 0.06))`,
                  color: `rgb(${albumPalette.accent})`,
                }}
              >
                <Music2 size={96} strokeWidth={1.4} aria-hidden="true" />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
