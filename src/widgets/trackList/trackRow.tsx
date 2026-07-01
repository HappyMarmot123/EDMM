"use client";

import { Track } from "@/entities/track";
import Link from "next/link";

export interface TrackRowProps {
  track: Track;
  isFavorite: boolean;
  onPlay: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
}

export function TrackRow({
  track,
  isFavorite,
  onPlay,
  onToggleFavorite,
}: TrackRowProps) {
  const handlePlay = () => {
    onPlay(track);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite(track.id);
  };

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border-b border-white/10 p-3">
      <button
        type="button"
        className="flex-1 text-left"
        onClick={handlePlay}
        data-testid={`track-row-title-${track.id}`}
        aria-label={`Play ${track.title}`}
      >
        <p className="font-medium line-clamp-1">{track.title}</p>
        <p className="text-sm text-gray-400 line-clamp-1">{track.artistName}</p>
      </button>
      <button
        type="button"
        className="rounded border border-white/10 px-3 py-1 text-sm"
        onClick={handleToggleFavorite}
        aria-label={
          isFavorite
            ? `Remove ${track.title} from favorites`
            : `Add ${track.title} to favorites`
        }
        aria-pressed={isFavorite}
      >
        {isFavorite ? "Saved" : "Save"}
      </button>
      <Link
        href={`/track/${encodeURIComponent(track.id)}`}
        className="rounded border border-white/10 px-3 py-1 text-sm transition-colors hover:bg-white/10"
        aria-label={`View details for ${track.title}`}
      >
        Details
      </Link>
    </li>
  );
}

export default TrackRow;
