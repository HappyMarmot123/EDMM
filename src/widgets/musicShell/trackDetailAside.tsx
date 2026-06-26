"use client";

import { useEffect, useState } from "react";
import { Disc3, Music2, Play, Radio, X } from "lucide-react";
import type { Track } from "@/entities/track/model";
import { AudioVisualizer } from "@/features/audio/components/audioVisualizer";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

type TrackDetailAsideProps = {
  selectedTrackId: string | null;
  fallbackTrack?: Track | null;
  queue: Track[];
  onPlay?: (track: Track, queue?: Track[]) => void;
  onClose?: () => void;
};

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <dt className="text-[11px] font-black uppercase text-[#ff98a2]">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-white/74" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function TrackDetailAside({
  selectedTrackId,
  fallbackTrack = null,
  queue,
  onPlay,
  onClose,
}: TrackDetailAsideProps) {
  const [cachedTrack, setCachedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentTrack, isPlaying, audioAnalyser } = useAudioPlayer();

  useEffect(() => {
    let isActive = true;
    setCachedTrack(null);

    if (!selectedTrackId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getCachedTrack(selectedTrackId)
      .then((track) => {
        if (isActive) {
          setCachedTrack(track ?? null);
        }
      })
      .catch(() => {
        if (isActive) {
          setCachedTrack(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedTrackId]);

  const track =
    cachedTrack?.id === selectedTrackId
      ? cachedTrack
      : fallbackTrack?.id === selectedTrackId
        ? fallbackTrack
        : null;
  const isCurrentTrack = track && currentTrack?.assetId === track.id;
  const isVisualizerActive = Boolean(isCurrentTrack && isPlaying);

  return (
    <aside
      aria-label="Track details"
      className="min-h-[420px] rounded-lg border border-white/10 bg-[#0b0609] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-white/72">Track detail</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close track detail"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/62 transition-colors hover:border-[#ff98a2]/35 hover:text-[#ffb8c0]"
          >
            <X size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {!selectedTrackId ? (
        <div className="flex h-full min-h-[360px] flex-col justify-center rounded-md border border-dashed border-white/12 p-5 text-center">
          <Music2 className="mx-auto text-[#ff98a2]" size={34} strokeWidth={1.8} />
          <h2 className="mt-4 text-lg font-black text-white">Select a track</h2>
        </div>
      ) : null}

      {selectedTrackId && !track && isLoading ? (
        <div role="status" className="space-y-4 text-sm text-white/62">
          <span>Loading details...</span>
          <div className="aspect-square animate-pulse rounded-md bg-white/10" />
          <div className="h-6 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      ) : null}

      {selectedTrackId && !track && !isLoading ? (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-black text-white">Details unavailable</h2>
          <p className="mt-2 break-all text-sm leading-6 text-white/58">
            Cached metadata was not found for {selectedTrackId}.
          </p>
        </div>
      ) : null}

      {track ? (
        <div className="space-y-4">
          <div
            aria-label={`${track.title} artwork`}
            role="img"
            className="relative aspect-square overflow-hidden rounded-md border border-white/10 bg-[#17070e] bg-cover bg-center"
            style={
              track.artworkUrl
                ? { backgroundImage: `url(${track.artworkUrl})` }
                : undefined
            }
          >
            {!track.artworkUrl ? (
              <span className="absolute inset-0 grid place-items-center text-[#ffb8c0]">
                <Disc3 size={70} strokeWidth={1.4} />
              </span>
            ) : null}
            <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
          </div>

          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#ff98a2]">
              <Radio size={15} strokeWidth={2.1} aria-hidden="true" />
              Cloudinary track
            </p>
            <h2
              data-testid="track-detail-title"
              className="mt-2 truncate text-2xl font-black text-white"
              title={track.title}
            >
              {track.title}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-white/62">
              {track.artistName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPlay?.(track, queue)}
            disabled={!onPlay || !track.streamUrl}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff98a2] px-4 text-sm font-black text-black transition-transform hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
          >
            <Play size={18} fill="currentColor" strokeWidth={2.1} aria-hidden="true" />
            Play selected
          </button>

          <dl className="grid gap-2">
            <DetailLine label="Duration" value={formatDuration(track.durationMs)} />
            <DetailLine label="Album" value={track.albumName ?? "Single"} />
            <DetailLine label="Source" value={track.source} />
            <DetailLine label="Track ID" value={track.id} />
          </dl>

          <AudioVisualizer
            analyser={audioAnalyser}
            isActive={isVisualizerActive}
            isCurrentTrack={Boolean(isCurrentTrack)}
            trackTitle={track.title}
            artistName={track.artistName}
          />
        </div>
      ) : null}
    </aside>
  );
}

export default TrackDetailAside;
