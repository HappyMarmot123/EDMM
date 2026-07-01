"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { CLAMP_VOLUME } from "@/shared/lib/util";

const SEEK_STEP_SECONDS = 10;
const VOLUME_STEP = 0.05;

const isShortcutBlockedTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  ) {
    return true;
  }

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, [contenteditable='true'], [role='button'], [role='slider']",
    ),
  );
};

export function useAudioKeyboardShortcuts() {
  const {
    currentTrack,
    currentTime,
    duration,
    seek,
    setLiveVolume,
    setVolume,
    togglePlayPause,
    volume,
  } = useAudioPlayer();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isShortcutBlockedTarget(event.target)
      ) {
        return;
      }

      const shortcutKey = event.code || event.key;
      const hasPlayableTrack = Boolean(currentTrack?.streamUrl);

      switch (shortcutKey) {
        case "Space":
        case " ": {
          if (!hasPlayableTrack || event.repeat) return;
          event.preventDefault();
          void togglePlayPause();
          break;
        }
        case "ArrowLeft": {
          if (!hasPlayableTrack || duration <= 0) return;
          event.preventDefault();
          seek(Math.max(0, currentTime - SEEK_STEP_SECONDS));
          break;
        }
        case "ArrowRight": {
          if (!hasPlayableTrack || duration <= 0) return;
          event.preventDefault();
          seek(Math.min(duration, currentTime + SEEK_STEP_SECONDS));
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const nextVolume = CLAMP_VOLUME(volume + VOLUME_STEP);
          setVolume(nextVolume);
          setLiveVolume(nextVolume);
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          const nextVolume = CLAMP_VOLUME(volume - VOLUME_STEP);
          setVolume(nextVolume);
          setLiveVolume(nextVolume);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentTime,
    currentTrack?.streamUrl,
    duration,
    seek,
    setLiveVolume,
    setVolume,
    togglePlayPause,
    volume,
  ]);
}
