"use client";

import { useEffect, useState } from "react";

const ENTER_PAINT_DELAY_MS = 20;

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * fade 전환이 필요한 조건부 렌더 요소의 mount/visible 상태.
 * open: 즉시 mount → 짧은 지연 후 visible (opacity-0 프레임이 먼저 페인트되어야 페이드가 동작)
 * close: 즉시 visible 해제 → exitMs 후 unmount
 * prefers-reduced-motion 시 지연 없이 즉시 전환한다.
 */
export function useFadePresence(isOpen: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (isOpen) {
      setMounted(true);
      if (reduced) {
        setVisible(true);
        return;
      }
      const timer = setTimeout(() => setVisible(true), ENTER_PAINT_DELAY_MS);
      return () => clearTimeout(timer);
    }

    setVisible(false);
    const timer = setTimeout(() => setMounted(false), reduced ? 0 : exitMs);
    return () => clearTimeout(timer);
  }, [isOpen, exitMs]);

  return { mounted, visible };
}
