"use client";

import { useCallback, useState } from "react";

export function useOncePerSession(key: string) {
  const storageKey = `edmm:once:${key}`;
  const [shouldRun, setShouldRun] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) !== "1";
  });

  const markDone = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }
    setShouldRun(false);
  }, [storageKey]);

  return { shouldRun, markDone };
}
