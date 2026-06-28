"use client";

import type { MusicView } from "@/widgets/musicShell/musicShellHeader";
import { SearchView } from "@/views/search";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

interface SearchPageClientProps {
  initialView?: MusicView;
  initialTrackId?: string;
}

export default function SearchPageClient({
  initialView,
  initialTrackId,
}: SearchPageClientProps) {
  return (
    <AudioPlayerShell>
      {(onPlay) => (
        <SearchView
          onPlay={onPlay}
          initialView={initialView}
          initialTrackId={initialTrackId}
        />
      )}
    </AudioPlayerShell>
  );
}
