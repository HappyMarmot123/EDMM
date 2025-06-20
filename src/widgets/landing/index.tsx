"use client";

import Hero from "@/features/landing/ui/landingHero";
import BodySection from "@/features/landing/ui/landingBodySection";
import React from "react";
import { useToggle } from "@/shared/providers/toggleProvider";
import AudioPlayer from "@/widgets/audioPlayer";
import ListModal from "@/widgets/listModal";
import { AnimatePresence } from "framer-motion";
import LandingWrapper from "@/features/landing/ui/landingWrapper";
import { ToggleProvider } from "@/shared/providers/toggleProvider";
import LenisProvider from "@/shared/providers/lenisProvider";

export default function Landing() {
  return (
    <ToggleProvider>
      <LenisProvider>
        <LandingContent />
      </LenisProvider>
    </ToggleProvider>
  );
}

function LandingContent() {
  const { isOpen } = useToggle();

  return (
    <LandingWrapper>
      <AnimatePresence>
        {!isOpen && <AudioPlayer />}
        {isOpen && <ListModal />}
      </AnimatePresence>
      <Hero />
      <BodySection />
    </LandingWrapper>
  );
}
