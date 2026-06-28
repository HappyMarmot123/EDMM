/* eslint-disable @next/next/no-img-element -- Fullscreen disc artwork receives dynamic CDN hosts. */
import { Disc3 } from "lucide-react";

type FullscreenAlbumDiscProps = {
  artworkSrc: string;
  trackTitle: string;
  isPlaying: boolean;
};

export default function FullscreenAlbumDisc({
  artworkSrc,
  trackTitle,
  isPlaying,
}: FullscreenAlbumDiscProps) {
  const hasArtwork = Boolean(artworkSrc);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute left-[80%] top-1/2 z-0 aspect-square w-[min(38vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full",
        "border border-white/12 bg-[#0b080c] shadow-[0_36px_110px_rgba(0,0,0,0.56)]",
        isPlaying ? "motion-safe:animate-[spin_28s_linear_infinite]" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,transparent_0_14%,rgba(0,0,0,0.86)_14.5%_18%,transparent_18.5%),conic-gradient(from_12deg,rgba(255,255,255,0.10),rgba(255,255,255,0.01),rgba(255,255,255,0.08),rgba(255,255,255,0.02),rgba(255,255,255,0.10))]" />

      {hasArtwork ? (
        <img
          src={artworkSrc}
          alt=""
          className="absolute inset-[7%] h-[86%] w-[86%] rounded-full object-cover opacity-78 mix-blend-screen saturate-[1.18]"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-[7%] grid place-items-center rounded-full bg-white/[0.035] text-[#fd6d94]">
          <Disc3 size={84} strokeWidth={1.2} aria-hidden="true" />
        </div>
      )}

      <div className="absolute inset-[41%] rounded-full bg-[#050306] shadow-[0_0_0_18px_rgba(0,0,0,0.18)]" />
      <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_20%,transparent_72%,rgba(255,255,255,0.06))]" />
      <span className="sr-only">{trackTitle} rotating disc artwork</span>
    </div>
  );
}
