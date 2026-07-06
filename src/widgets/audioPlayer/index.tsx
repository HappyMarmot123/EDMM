"use client";

import { useEffect, useState } from "react";
import {
  AudioPlayer,
  MobileAudioPlayer,
  useAudioKeyboardShortcuts,
} from "@/features/audio";

type PlayerViewport = "desktop" | "mobile";

const DESKTOP_PLAYER_VIEWPORT_QUERY = "(min-width: 768px)";

export default function AudioPlayerWidget() {
  useAudioKeyboardShortcuts();
  const [playerViewport, setPlayerViewport] = useState<PlayerViewport | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setPlayerViewport("mobile");
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_PLAYER_VIEWPORT_QUERY);
    const updateViewport = () => {
      setPlayerViewport(mediaQuery.matches ? "desktop" : "mobile");
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  if (!playerViewport) {
    return null;
  }

  return playerViewport === "desktop" ? <AudioPlayer /> : <MobileAudioPlayer />;
}
