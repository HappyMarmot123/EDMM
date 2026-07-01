"use client";

import type { Track } from "@/entities/track";
import MusicShell from "@/widgets/musicShell";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";

export interface SearchViewProps {
  onPlay?: (track: Track, queue?: Track[], playImmediately?: boolean) => void;
  initialView?: MusicView;
  initialTrackId?: string | null;
}

export function SearchView({
  onPlay,
  initialView,
  initialTrackId = null,
}: SearchViewProps) {
  return (
    <MusicShell
      onPlay={onPlay}
      initialView={initialView}
      initialTrackId={initialTrackId}
    />
  );
}

export default SearchView;
