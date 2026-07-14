"use client";

import { useCallback, useState } from "react";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { getMobilePlatform } from "@/shared/lib/deviceDetection";
import { safeLocalStorage } from "@/shared/lib/safeLocalStorage";
import {
  APP_PROMO_STORAGE_KEY,
  DISMISS_DURATION_MS,
} from "@/features/appPromo/config";

const isDismissActive = (): boolean => {
  const { value } = safeLocalStorage.getItem(APP_PROMO_STORAGE_KEY);
  if (value === null) {
    return false;
  }
  const until = Number(value);
  return Number.isFinite(until) && Date.now() < until;
};

export function useAndroidAppPromo(): {
  shouldShow: boolean;
  dismiss: () => void;
} {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    safeLocalStorage.setItem(
      APP_PROMO_STORAGE_KEY,
      String(Date.now() + DISMISS_DURATION_MS),
    );
    setDismissed(true);
  }, []);

  const isAndroid =
    hydrated && getMobilePlatform(window.navigator.userAgent) === "android";

  const shouldShow = hydrated && isAndroid && !dismissed && !isDismissActive();

  return { shouldShow, dismiss };
}
