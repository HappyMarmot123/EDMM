"use client";

import { useEffect, useState } from "react";
import DustySnow from "@/features/landing/components/dustySnow";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function RoseSpaceBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="rose-space-background"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-testid="rose-space-background"
    >
      <div className="rose-space-background__depth" />
      <DustySnow reducedMotion={reducedMotion} />
    </div>
  );
}
