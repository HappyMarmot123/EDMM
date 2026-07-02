"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { CLAMP_VOLUME } from "@/shared/lib/util";

const SEEK_STEP_SECONDS = 10;
const VOLUME_STEP = 0.05;

type ShortcutBlockLevel = "all" | "arrows" | "none";

// 타이핑 컨텍스트만 전면 차단하고, 슬라이더류는 고유 조작인 화살표 키만 차단한다.
// 버튼은 차단하지 않는다 — 중복 활성화는 PlayerControlButton의
// blurOnPointerClick(포인터 클릭 후 포커스 해제)이 방지한다.
const getShortcutBlockLevel = (
  target: EventTarget | null,
): ShortcutBlockLevel => {
  if (!(target instanceof HTMLElement)) {
    return "none";
  }

  if (target instanceof HTMLInputElement) {
    return target.type === "range" ? "arrows" : "all";
  }

  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    target.closest("textarea, select, [contenteditable='true']")
  ) {
    return "all";
  }

  if (target.closest("input[type='range'], [role='slider']")) {
    return "arrows";
  }

  return "none";
};

export function useAudioKeyboardShortcuts() {
  const {
    currentTrack,
    currentTime,
    duration,
    nextTrack,
    prevTrack,
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
        event.metaKey
      ) {
        return;
      }

      const blockLevel = getShortcutBlockLevel(event.target);
      if (blockLevel === "all") {
        return;
      }

      const shortcutKey = event.code || event.key;
      if (blockLevel === "arrows" && shortcutKey.startsWith("Arrow")) {
        return;
      }

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
        case "KeyN":
        case "n":
        case "N": {
          if (!hasPlayableTrack || event.repeat) return;
          event.preventDefault();
          nextTrack();
          break;
        }
        case "KeyP":
        case "p":
        case "P": {
          if (!hasPlayableTrack || event.repeat) return;
          event.preventDefault();
          prevTrack();
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
    nextTrack,
    prevTrack,
    seek,
    setLiveVolume,
    setVolume,
    togglePlayPause,
    volume,
  ]);
}
