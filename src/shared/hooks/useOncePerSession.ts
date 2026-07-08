"use client";

import { useCallback, useState } from "react";
import { safeSessionStorage } from "@/shared/lib/safeSessionStorage";

const shouldRunOncePerSession = (storageKey: string): boolean => {
  const stored = safeSessionStorage.getItem(storageKey);

  if (!stored.isBrowser) {
    return false;
  }

  return stored.value !== "1";
};

export function useOncePerSession(key: string) {
  const storageKey = `edmm:once:${key}`;
  const [shouldRun, setShouldRun] = useState(() => shouldRunOncePerSession(storageKey));

  const markDone = useCallback(() => {
    safeSessionStorage.setItem(storageKey, "1");
    setShouldRun(false);
  }, [storageKey]);

  return { shouldRun, markDone };
}
