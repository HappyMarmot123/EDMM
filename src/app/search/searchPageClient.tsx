"use client";

import type { MusicView } from "@/widgets/musicShell/musicShellHeader";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";
import { SearchView } from "@/views/search";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

interface SearchPageClientProps {
  initialView?: MusicView;
  initialTrackId?: string;
  initialResourceType?: ResourceTypeFilter;
}

export default function SearchPageClient({
  initialView,
  initialTrackId,
  initialResourceType,
}: SearchPageClientProps) {
  return (
    <AudioPlayerShell>
      {(onPlay) => (
        <SearchView
          onPlay={onPlay}
          initialView={initialView}
          initialTrackId={initialTrackId}
          initialResourceType={initialResourceType}
        />
      )}
    </AudioPlayerShell>
  );
}
