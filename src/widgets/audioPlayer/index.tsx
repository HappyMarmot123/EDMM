"use client";

import { useEffect, useState } from "react";
import {
  AudioPlayer,
  MobileAudioPlayer,
  useAudioKeyboardShortcuts,
} from "@/features/audio";

export default function AudioPlayerWidget() {
  useAudioKeyboardShortcuts();

  // The player is driven entirely by client-side state (current track, playback,
  // restored recents). Rendering it during SSR/first hydration would diverge from
  // the client once that state loads, causing a hydration mismatch. Render it only
  // after mount so the server and first client render always agree (nothing).
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="hidden md:block">
        <AudioPlayer />
      </div>
      <div className="md:hidden">
        <MobileAudioPlayer />
      </div>
    </>
  );
}
