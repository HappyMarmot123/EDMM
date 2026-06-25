"use client";

import type { Track } from "@/entities/track/model";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "@/shared/providers/audioPlayerProvider";
import { ToggleProvider } from "@/shared/providers/toggleProvider";
import type { ReactNode } from "react";
import AudioPlayerWidget from ".";

interface AudioPlayerShellProps {
  children: (onPlay: (track: Track, queue?: Track[]) => void) => ReactNode;
}

export default function AudioPlayerShell({ children }: AudioPlayerShellProps) {
  return (
    <AudioPlayerProvider>
      <AudioPlayerShellContent>{children}</AudioPlayerShellContent>
    </AudioPlayerProvider>
  );
}

function AudioPlayerShellContent({ children }: AudioPlayerShellProps) {
  const { playTrack } = useAudioPlayer();

  return (
    <ToggleProvider>
      {children(playTrack)}
      <AudioPlayerWidget />
    </ToggleProvider>
  );
}
