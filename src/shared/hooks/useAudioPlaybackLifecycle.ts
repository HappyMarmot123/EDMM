"use client";

import { useEffect } from "react";

type AudioPlaybackLifecycleConfig = {
  isPlaying: boolean;
  audioContext: AudioContext | null;
};

export function useAudioPlaybackLifecycle({
  isPlaying,
  audioContext,
}: AudioPlaybackLifecycleConfig) {
  useEffect(() => {
    if (typeof document === "undefined" || !audioContext) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!isPlaying || document.visibilityState !== "visible") {
        return;
      }

      if (audioContext.state === "suspended") {
        void audioContext
          .resume()
          .catch(() => {
            // Mobile Safari or autoplay policy may block resume without gesture.
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [audioContext, isPlaying]);
}
