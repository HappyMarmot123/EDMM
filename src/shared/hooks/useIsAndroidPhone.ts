"use client";

import { useViewport } from "@/shared/hooks/useViewport";
import { getMobilePlatform } from "@/shared/lib/deviceDetection";

export function useIsAndroidPhone(): boolean {
  const { isMobile, isClient } = useViewport();

  if (!isClient) {
    return false;
  }

  return isMobile && getMobilePlatform(window.navigator.userAgent) === "android";
}
