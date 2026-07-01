"use client";

import { useEffect, useRef } from "react";

type AudioPlaybackLifecycleConfig = {
  isPlaying: boolean;
  audioContext: AudioContext | null;
  audio?: HTMLAudioElement | null;
  restoreStrategy?: "context-first" | "media-element-first";
};

export function useAudioPlaybackLifecycle({
  isPlaying,
  audioContext,
  audio,
  restoreStrategy = "context-first",
}: AudioPlaybackLifecycleConfig) {
  const wasPlayingBeforeHide = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const tryResumePlayback = async () => {
      if (!audioContext || !isPlaying) {
        return;
      }

      const resumeContext = async () => {
        if (audioContext.state !== "suspended") {
          return;
        }

        try {
          await audioContext.resume();
        } catch {
          // Mobile Safari or autoplay policy may block resume without gesture.
        }
      };

      const resumeAudioElement = async () => {
        if (!audio || !audio.paused) {
          return;
        }

        try {
          await audio.play();
        } catch {
          // Mobile Safari may require explicit user gesture.
        }
      };

      if (restoreStrategy === "media-element-first") {
        await resumeAudioElement();
        await resumeContext();
        await resumeAudioElement();
        return;
      }

      await resumeContext();
      await resumeAudioElement();
    };

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      if (!isVisible) {
        wasPlayingBeforeHide.current = isPlaying;
        return;
      }

      if (!wasPlayingBeforeHide.current) {
        if (isPlaying) {
          void tryResumePlayback();
        }
        return;
      }

      wasPlayingBeforeHide.current = false;
      void tryResumePlayback();
    };

    const handlePageHide = () => {
      if (isPlaying) {
        wasPlayingBeforeHide.current = true;
      }
    };

    const handlePageShow = () => {
      if (!wasPlayingBeforeHide.current) {
        return;
      }
      wasPlayingBeforeHide.current = false;
      void tryResumePlayback();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [audio, audioContext, isPlaying, restoreStrategy]);

}
