"use client";

import {
  AudioPlayer,
  MobileAudioPlayer,
  useAudioKeyboardShortcuts,
} from "@/features/audio";

export default function AudioPlayerWidget() {
  useAudioKeyboardShortcuts();

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
