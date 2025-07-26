"use client";

import AudioPlayer from "@/features/audio/ui/audioPlayer";
import MobileAudioPlayer from "@/features/audio/ui/mobileAudioPlayer";
import { useViewport } from "@/shared/hooks/useViewport";

export default function AudioPlayerWidget() {
  const { isMobile } = useViewport();

  if (isMobile) {
    return <MobileAudioPlayer />;
  }
  return <AudioPlayer />;
}
