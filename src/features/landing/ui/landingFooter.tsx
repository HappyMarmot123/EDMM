"use client";

import Link from "next/link";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

export default function Footer() {
  const currentTrackId = useAudioPlayer().currentTrack?.assetId ?? "";
  const searchHref = currentTrackId
    ? `/search?track=${encodeURIComponent(currentTrackId)}`
    : "/search";

  return (
    <footer
      className="rose-footer"
      aria-label="EDMM footer"
      data-testid="rose-footer"
    >
      <p className="rose-footer__brand">EDMM / Rose Orbit</p>
      <nav className="rose-footer__nav" aria-label="Footer navigation">
        <Link href={searchHref}>Search</Link>
      </nav>
      <p className="rose-footer__meta">2026 EDMM. Midnight signal stays live.</p>
    </footer>
  );
}
