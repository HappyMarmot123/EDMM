"use client";

import { useFavorites } from "@/features/library/hooks/useFavorites";
import { Track } from "@/entities/Track/model";
import { TrackRow } from "./trackRow";

export interface TrackListProps {
  tracks?: Track[] | null;
  onPlay: (track: Track) => void;
  isLoading?: boolean;
}

export function TrackList({
  tracks,
  onPlay,
  isLoading = false,
}: TrackListProps) {
  const list = tracks ?? [];
  const { isFavorite, toggle } = useFavorites();

  if (isLoading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  if (list.length === 0) {
    return <p className="text-sm text-gray-400">트랙이 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {list.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onPlay={onPlay}
          isFavorite={isFavorite(track.id)}
          onToggleFavorite={toggle}
        />
      ))}
    </ul>
  );
}

export default TrackList;
