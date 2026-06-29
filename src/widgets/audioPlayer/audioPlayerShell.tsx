"use client";

import type { Track } from "@/entities/track/model";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import type { ReactNode } from "react";

interface AudioPlayerShellProps {
  children: (
    onPlay: (track: Track, queue?: Track[], playImmediately?: boolean) => void,
  ) => ReactNode;
}

export default function AudioPlayerShell({ children }: AudioPlayerShellProps) {
  const { playTrack } = useAudioPlayer();

  return children(playTrack);
}
