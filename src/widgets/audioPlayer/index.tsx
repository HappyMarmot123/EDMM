"use client";

import AudioPlayer from "@/features/audio/ui/audioPlayer";
import MobileAudioPlayer from "@/features/audio/ui/mobileAudioPlayer";

export default function AudioPlayerWidget() {
  return (
    <>
      <div className="hidden md:block">
        <AudioPlayer />
      </div>
      <div className="md:hidden">
        <MobileAudioPlayer />
      </div>
    </>
  );
}
