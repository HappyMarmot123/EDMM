"use client";

import type { Track } from "@/entities/track/model";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { ToggleProvider } from "@/shared/providers/toggleProvider";
import type { ReactNode } from "react";
import AudioPlayerWidget from ".";

interface AudioPlayerShellProps {
  children: (onPlay: (track: Track, queue?: Track[]) => void) => ReactNode;
}

export default function AudioPlayerShell({ children }: AudioPlayerShellProps) {
  const { playTrack } = useAudioPlayer();

  return (
    <ToggleProvider>
      {children(playTrack)}
      <AudioPlayerWidget />
    </ToggleProvider>
  );
}
