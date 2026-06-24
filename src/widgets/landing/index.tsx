"use client";

import Hero from "@/features/landing/ui/landingHero";
import BodySection from "@/features/landing/ui/landingBodySection";
import React from "react";
import LandingWrapper from "@/features/landing/ui/landingWrapper";
import dynamic from "next/dynamic";

const LenisProvider = dynamic(() => import("@/shared/providers/lenisProvider"), {
  ssr: false,
});

export default function Landing() {
  return (
    <LenisProvider>
      <LandingWrapper>
        <Hero />
        <BodySection />
      </LandingWrapper>
    </LenisProvider>
  );
}
