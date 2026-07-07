"use client";

import type { Track } from "@/entities/track";

interface MPlayerTrackDetailsProps {
  currentTrackInfo?: Track | null;
}

export default function MPlayerTrackDetails({
  currentTrackInfo,
}: MPlayerTrackDetailsProps) {
  return (
    <div className="mx-3 flex min-w-0 flex-1 flex-col justify-center">
      <div className="flex items-baseline">
        <span className="truncate text-sm font-semibold text-white">
          {currentTrackInfo?.title ?? "No track selected"}
        </span>
      </div>
      <div className="mt-0.5 min-w-0 text-xs font-medium text-white/55">
        <span className="block truncate">
          {currentTrackInfo?.artistName ?? "Choose a song to start playback"}
        </span>
      </div>
    </div>
  );
}