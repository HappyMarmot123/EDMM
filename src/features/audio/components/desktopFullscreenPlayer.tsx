/* eslint-disable @next/next/no-img-element -- Fullscreen artwork receives dynamic CDN hosts. */
import { useEffect } from "react";
import { Minimize2, Music2 } from "lucide-react";
import type { TrackInfo } from "@/shared/types/dataType";

type DesktopFullscreenPlayerProps = {
  currentTrackInfo: TrackInfo | null;
  onClose: () => void;
};

export default function DesktopFullscreenPlayer({
  currentTrackInfo,
  onClose,
}: DesktopFullscreenPlayerProps) {
  const artworkSrc = currentTrackInfo?.artworkId?.trim() ?? "";
  const trackTitle = currentTrackInfo?.name ?? "No track selected";
  const hasArtwork = Boolean(artworkSrc);

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
      className="fixed inset-0 z-[60] hidden min-h-dvh overflow-hidden bg-[#050505] text-white lg:block"
    >
      {hasArtwork ? (
        <img
          src={artworkSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-[-12%] h-[124%] w-[124%] scale-105 object-cover opacity-35 blur-3xl"
          draggable={false}
        />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.16),rgba(8,8,8,0.62)_38%,rgba(0,0,0,0.96)_82%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.78))]" />

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
          <div className="relative aspect-square w-[min(42vw,440px)] overflow-hidden rounded-xl bg-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.58)] ring-1 ring-white/12">
            {hasArtwork ? (
              <img
                src={artworkSrc}
                alt={`${trackTitle} fullscreen artwork`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(253,109,148,0.22),rgba(255,255,255,0.06))] text-[#fd6d94]">
                <Music2 size={96} strokeWidth={1.4} aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
