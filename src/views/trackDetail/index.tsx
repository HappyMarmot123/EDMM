"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Disc3,
  ExternalLink,
  Library,
  Mic2,
  Music2,
  Play,
  Radio,
  Search,
} from "lucide-react";
import type { Track } from "@/entities/track/model";
import { isPlayable } from "@/entities/track/model";
import { AudioVisualizer } from "@/features/audio/components/audioVisualizer";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";

export interface TrackDetailViewProps {
  trackId: string;
  onPlay?: (track: Track) => void;
}

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const sourceLabel = (source: Track["source"]) =>
  source === "audius" ? "Audius" : "Deezer";

function TrackDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#050306] px-4 pb-40 pt-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-32 animate-pulse rounded-md bg-white/10" />
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="aspect-square animate-pulse rounded-lg bg-white/10" />
          <div className="space-y-4">
            <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-14 w-full max-w-xl animate-pulse rounded bg-white/10" />
            <div className="h-5 w-52 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </section>
    </main>
  );
}

function MissingTrackState({ trackId }: { trackId: string }) {
  return (
    <main className="min-h-screen bg-[#050306] px-4 pb-40 pt-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <Link
          href="/search"
          className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/72 transition-colors hover:border-[#ff98a2]/45 hover:text-white"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to search
        </Link>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 sm:p-8">
          <p className="text-xs font-black uppercase text-[#ffb8c0]">
            Track detail
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            No track details found.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
            This page uses the local track cache. Open a track from Search,
            Trending, or Library first, then the detail page can hydrate the
            full metadata.
          </p>
          <p className="mt-4 rounded-md border border-white/10 bg-black/24 px-3 py-2 text-xs text-white/45">
            Requested ID: {trackId}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ff98a2] px-5 text-sm font-black text-black transition-transform hover:scale-[1.02]"
            >
              <Search size={18} aria-hidden="true" />
              Search for music
            </Link>
            <Link
              href="/library"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-bold text-white/72 transition-colors hover:border-white/30 hover:text-white"
            >
              <Library size={18} aria-hidden="true" />
              Open library
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrackArtwork({ track }: { track: Track }) {
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#16080f] shadow-[0_30px_80px_rgba(0,0,0,0.38)]"
      aria-label={`${track.title} artwork`}
      role="img"
    >
      {track.artworkUrl ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${track.artworkUrl})` }}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-[#ffb8c0]">
          <Disc3 size={74} strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 h-24 bg-black/35" />
    </div>
  );
}

function DetailFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Music2;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-[#ffb8c0]">
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
        <span className="text-xs font-black uppercase">{label}</span>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-white/78" title={value}>
        {value}
      </p>
    </div>
  );
}

export function TrackDetailView({ trackId, onPlay }: TrackDetailViewProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(true);
  const { currentTrack, isPlaying, audioAnalyser } = useAudioPlayer();

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
    return <TrackDetailSkeleton />;
  }

  if (!track) {
    return <MissingTrackState trackId={trackId} />;
  }

  const canPlay = Boolean(onPlay) && isPlayable(track);
  const isCurrentTrack = currentTrack?.assetId === track.id;
  const isVisualizerActive = isCurrentTrack && isPlaying;
  const albumLabel = track.albumName || "Single";

  return (
    <main className="min-h-screen bg-[#050306] px-4 pb-40 pt-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-bold text-white/72 transition-colors hover:border-[#ff98a2]/45 hover:text-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to search
          </Link>
          <Link
            href="/library"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-bold text-white/58 transition-colors hover:border-white/30 hover:text-white"
          >
            <Library size={17} aria-hidden="true" />
            Library
          </Link>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-end">
          <TrackArtwork track={track} />

          <div className="min-w-0 space-y-5">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#ffb8c0]">
                <Radio size={16} strokeWidth={2.2} aria-hidden="true" />
                {sourceLabel(track.source)} track
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">
                {track.title}
              </h1>
              <p className="mt-3 text-lg font-semibold text-white/68">
                {track.artistName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onPlay?.(track)}
                disabled={!canPlay}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ff98a2] px-6 text-sm font-black text-black transition-transform hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-45"
              >
                <Play size={19} fill="currentColor" aria-hidden="true" />
                Play
              </button>
              <Link
                href="/search"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-bold text-white/72 transition-colors hover:border-white/30 hover:text-white"
              >
                <ExternalLink size={18} aria-hidden="true" />
                Find more
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailFact
            label="Duration"
            value={formatDuration(track.durationMs)}
            icon={Clock3}
          />
          <DetailFact label="Album" value={albumLabel} icon={Disc3} />
          <DetailFact
            label="Source"
            value={sourceLabel(track.source)}
            icon={Radio}
          />
          <DetailFact label="Track ID" value={track.id} icon={Music2} />
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <AudioVisualizer
            analyser={audioAnalyser}
            isActive={isVisualizerActive}
          />

          <section
            aria-labelledby="lyrics-title"
            className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
          >
            <div className="mb-3 flex items-center gap-2 text-[#ffb8c0]">
              <Mic2 size={18} strokeWidth={2} aria-hidden="true" />
              <h2 id="lyrics-title" className="text-xl font-black text-white">
                Lyrics
              </h2>
            </div>
            {isLyricsLoading ? (
              <p className="text-sm text-white/62">Loading lyrics...</p>
            ) : isLyricsError ? (
              <p className="text-sm text-white/62">Failed to load lyrics.</p>
            ) : (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-black/28 p-4 text-sm leading-6 text-white/72">
                {resolvedLyrics ?? "No lyrics available."}
              </pre>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default TrackDetailView;
