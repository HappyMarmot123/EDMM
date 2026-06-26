"use client";

import type { Track } from "@/entities/track/model";
import MusicShell from "@/widgets/musicShell";

export interface SearchViewProps {
  onPlay?: (track: Track, queue?: Track[]) => void;
}

export function SearchView({ onPlay }: SearchViewProps) {
  return <MusicShell onPlay={onPlay} />;
}

export default SearchView;
