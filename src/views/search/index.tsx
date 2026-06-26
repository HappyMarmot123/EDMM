"use client";

import type { Track } from "@/entities/Track/model";
import MusicShell from "@/widgets/musicShell";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";

export interface SearchViewProps {
  onPlay?: (track: Track, queue?: Track[], playImmediately?: boolean) => void;
  initialView?: MusicView;
  initialTrackId?: string | null;
  initialResourceType?: ResourceTypeFilter;
}

export function SearchView({
  onPlay,
  initialView,
  initialTrackId = null,
  initialResourceType,
}: SearchViewProps) {
  return (
    <MusicShell
      onPlay={onPlay}
      initialView={initialView}
      initialTrackId={initialTrackId}
      initialResourceType={initialResourceType}
    />
  );
}

export default SearchView;
