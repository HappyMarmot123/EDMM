"use client";

import { TrackDetailView } from "@/views/trackDetail";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

interface TrackDetailPageClientProps {
  trackId: string;
}

export default function TrackDetailPageClient({
  trackId,
}: TrackDetailPageClientProps) {
  return (
    <AudioPlayerShell>
      {(onPlay) => <TrackDetailView trackId={trackId} onPlay={onPlay} />}
    </AudioPlayerShell>
  );
}
