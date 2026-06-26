"use client";

import Link from "next/link";
import DeprecatedRoseHeroOrbit from "./deprecatedRoseHeroOrbit";
import LandingCobeOrbit from "./landingCobeOrbit";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

export default function Hero() {
  const currentTrackId = useAudioPlayer().currentTrack?.assetId ?? "";
  const searchHref = currentTrackId
    ? `/search?track=${encodeURIComponent(currentTrackId)}`
    : "/search";

  return (
    <section className="rose-hero" aria-labelledby="rose-hero-title">
      <div className="rose-hero__inner">
        <div className="rose-hero__content">
          <p className="rose-hero__eyebrow">
            Rose Orbit / Midnight signal / Dance floor
          </p>
          <h1 id="rose-hero-title" className="rose-hero__title">
            EDMM
          </h1>
          <p className="rose-hero__kicker">
            Electronic dance music in rose orbit
          </p>
          <p className="rose-hero__copy">
            Search late-night electronic tracks, collect the cuts that stay
            with you, and keep the whole session inside a rose-lit signal.
          </p>
          <div className="rose-hero__actions">
            <Link
              className="rose-hero__cta rose-hero__cta--primary"
              href={searchHref}
            >
              Start listening
            </Link>
          </div>
          <div className="rose-hero__meta" aria-label="EDMM landing signals">
            <span>Search-first</span>
            <span>Rosefall background</span>
            <span>Library flow</span>
          </div>
        </div>

        <LandingCobeOrbit />
        <DeprecatedRoseHeroOrbit />
      </div>
    </section>
  );
}
