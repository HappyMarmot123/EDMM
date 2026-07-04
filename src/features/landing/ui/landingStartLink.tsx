"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

const SEARCH_PATH = "/search";

type TrackLike = {
  id?: string | null;
  title?: string | null;
} | null | undefined;

type LandingStartLinkProps = {
  children?: ReactNode;
  className?: string;
};

export function getLandingStartHref(track: TrackLike) {
  const trackKey = track?.id?.trim() || track?.title?.trim();

  if (!trackKey) {
    return SEARCH_PATH;
  }

  return `${SEARCH_PATH}?track=${encodeURIComponent(trackKey)}`;
}

export function LandingStartLink({
  children = "Start listening",
  className = "rose-hero__cta rose-hero__cta--primary",
}: LandingStartLinkProps) {
  const { currentTrack } = useAudioPlayer();

  return (
    <Link href={getLandingStartHref(currentTrack)} className={className}>
      {children}
    </Link>
  );
}