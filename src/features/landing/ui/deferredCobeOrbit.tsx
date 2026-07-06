"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const IDLE_TIMEOUT_MS = 1800;
const FALLBACK_DELAY_MS = 1200;

const LandingCobeOrbit = dynamic(() => import("./landingCobeOrbit"), {
  ssr: false,
  loading: () => <CobeOrbitShell />,
});

export function CobeOrbitShell() {
  return (
    <div
      className="rose-cobe-orbit rose-cobe-orbit--shell"
      data-testid="rose-cobe-orbit"
      aria-hidden="true"
    >
      <div data-testid="rose-cobe-orbit-shell" className="rose-cobe-orbit__halo" />
      <canvas
        className="rose-cobe-orbit__canvas rose-cobe-orbit__canvas--shell"
        data-testid="rose-cobe-canvas"
      />
    </div>
  );
}

export function DeferredCobeOrbit() {
  const [shouldRenderOrbit, setShouldRenderOrbit] = useState(false);

  useEffect(() => {
    const setFallbackTimeout = window.setTimeout.bind(window);
    const clearFallbackTimeout = window.clearTimeout.bind(window);

    if (shouldRenderOrbit) {
      return undefined;
    }

    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(
        () => setShouldRenderOrbit(true),
        { timeout: IDLE_TIMEOUT_MS },
      );

      return () => window.cancelIdleCallback(handle);
    }

    const timeout = setFallbackTimeout(
      () => setShouldRenderOrbit(true),
      FALLBACK_DELAY_MS,
    );

    return () => clearFallbackTimeout(timeout);
  }, [shouldRenderOrbit]);

  if (!shouldRenderOrbit) {
    return <CobeOrbitShell />;
  }

  return <LandingCobeOrbit />;
}