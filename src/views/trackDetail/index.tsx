"use client";

import { useEffect, useState } from "react";
import type { Track } from "@/entities/track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";

export interface TrackDetailViewProps {
  trackId: string;
  onPlay?: (track: Track) => void;
}

export function TrackDetailView({ trackId, onPlay }: TrackDetailViewProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadTrack = async () => {
      setIsTrackLoading(true);
      try {
        const cachedTrack = await getCachedTrack(trackId);
        if (!isCancelled) {
          setTrack(cachedTrack ?? null);
        }
      } catch {
        if (!isCancelled) {
          setTrack(null);
        }
      } finally {
        if (!isCancelled) {
          setIsTrackLoading(false);
        }
      }
    };

    loadTrack();

    return () => {
      isCancelled = true;
    };
  }, [trackId]);

  const {
    data: resolvedLyrics,
    isLoading: isLyricsLoading,
    isError: isLyricsError,
  } = useLyrics(track?.artistName ?? "", track?.title ?? "");

  if (isTrackLoading) {
    return (
      <main className="bg-black min-h-screen px-4 py-8 text-white">
        <p>Loading track detail...</p>
      </main>
    );
  }

  if (!track) {
    return (
      <main className="bg-black min-h-screen px-4 py-8 text-white">
        <p>No track details found.</p>
      </main>
    );
  }

  return (
    <main className="bg-black min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">{track.title}</h1>
        <h2 className="text-lg">{track.artistName}</h2>
        {onPlay && track.streamUrl ? (
          <button
            type="button"
            onClick={() => onPlay(track)}
            className="rounded border border-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            Play
          </button>
        ) : null}
        {isLyricsLoading ? (
          <p>Loading lyrics...</p>
        ) : isLyricsError ? (
          <p>Failed to load lyrics.</p>
        ) : (
          <pre className="whitespace-pre-wrap bg-neutral-900 p-4 rounded">
            {resolvedLyrics ?? "No lyrics available."}
          </pre>
        )}
      </section>
    </main>
  );
}

export default TrackDetailView;
