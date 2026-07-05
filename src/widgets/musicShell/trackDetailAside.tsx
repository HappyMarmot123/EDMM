"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Disc3, Link, Maximize2, Music2, Radio } from "lucide-react";
import type { Track } from "@/entities/track";
import { AudioVisualizer, EqualizerPanel } from "@/features/audio";
import { getCachedTrack } from "@/shared/db";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { dispatchEdmmEvent, EDMM_EVENTS } from "@/shared/lib/edmmEvents";
import { pickArtworkUrl } from "@/shared/lib/trackArtwork";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";

type TrackDetailAsideProps = {
  selectedTrackId: string | null;
  fallbackTrack?: Track | null;
  isWaitingForSelectionSeed?: boolean;
};

const TRACK_DETAIL_FULLSCREEN_VIEWPORT_QUERY = "(min-width: 768px)";

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

type DetailLineProps = {
  label: string;
  value: ReactNode;
};

function DetailLine({ label, value }: DetailLineProps) {
  const valueText = typeof value === "string" ? value : undefined;

  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <dt className="text-[11px] font-black uppercase text-[#ff98a2]">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-white/74" title={valueText}>
        {value}
      </dd>
    </div>
  );
}

export function TrackDetailAside({
  selectedTrackId,
  fallbackTrack = null,
  isWaitingForSelectionSeed = false,
}: TrackDetailAsideProps) {
  const [cachedTrack, setCachedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canUseArtworkFullscreen = useMediaQuery(
    TRACK_DETAIL_FULLSCREEN_VIEWPORT_QUERY,
    false,
  );
  const { currentTrack, isPlaying, audioAnalyser, duration } = useAudioPlayer();

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

  const liveTrackFallback = useMemo(() => {
    if (!currentTrack || currentTrack.id !== selectedTrackId) {
      return null;
    }

    const fallbackDurationMs =
      duration > 0
        ? Math.round(duration * 1000)
        : (fallbackTrack?.durationMs ?? 0);

    return {
      ...currentTrack,
      artworkUrl: pickArtworkUrl(
        currentTrack.artworkUrl,
        fallbackTrack?.artworkUrl,
      ),
      durationMs: fallbackDurationMs,
    };
  }, [currentTrack, duration, fallbackTrack?.artworkUrl, selectedTrackId]);

  const track = useMemo(() => {
    if (!selectedTrackId) return null;

    if (cachedTrack?.id === selectedTrackId) {
      const cachedArtworkUrl = pickArtworkUrl(
        cachedTrack.artworkUrl,
        fallbackTrack?.artworkUrl ?? liveTrackFallback?.artworkUrl,
      );

      return {
        ...fallbackTrack,
        ...cachedTrack,
        artworkUrl: cachedArtworkUrl,
        durationMs: cachedTrack.durationMs || liveTrackFallback?.durationMs || 0,
      };
    }

    if (fallbackTrack?.id === selectedTrackId) {
      return {
        ...fallbackTrack,
        artworkUrl: pickArtworkUrl(
          fallbackTrack.artworkUrl,
          liveTrackFallback?.artworkUrl,
        ),
      };
    }

    return liveTrackFallback;
  }, [cachedTrack, fallbackTrack, selectedTrackId, liveTrackFallback]);

  const isCurrentTrack = track && currentTrack?.id === track.id;
  const isVisualizerActive = Boolean(isCurrentTrack && isPlaying);
  const canOpenArtworkFullscreen = Boolean(
    canUseArtworkFullscreen && track?.artworkUrl,
  );
  const hasVisibleFallbackCandidate = Boolean(
    fallbackTrack && fallbackTrack.id !== selectedTrackId,
  );
  const shouldShowLoadingState = Boolean(
    selectedTrackId &&
      !track &&
      (isLoading || (isWaitingForSelectionSeed && !hasVisibleFallbackCandidate)),
  );
  const shouldShowUnavailableState = Boolean(
    selectedTrackId &&
      !track &&
      !isLoading &&
      (!isWaitingForSelectionSeed || hasVisibleFallbackCandidate),
  );
  const githubUrl =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_GITHUB_URL?.trim()) ||
    "https://github.com/HappyMarmot123";

  const handleOpenArtworkFullscreen = () => {
    if (!track || !canOpenArtworkFullscreen || typeof window === "undefined") {
      return;
    }

    dispatchEdmmEvent(window, EDMM_EVENTS.openPlayerFullscreen, { track });
  };

  return (
    <>
      <aside
        aria-label="Track details"
        className="flex h-full min-h-0 flex-col rounded-lg border border-white/10 bg-[#0b0609] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <p className="inline-flex items-center gap-2 mb-4 text-xs font-black uppercase text-[#ff98a2]">
          <Radio size={15} strokeWidth={2.1} aria-hidden="true" />
          Track Detail
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {!selectedTrackId ? (
            <div className="flex h-full min-h-[280px] flex-col justify-center rounded-md border border-dashed border-white/12 p-5 text-center">
              <Music2 className="mx-auto text-[#ff98a2]" size={34} strokeWidth={1.8} />
              <h2 className="mt-4 text-lg font-black text-white">Select a track</h2>
            </div>
          ) : null}

          {shouldShowLoadingState ? (
            <div role="status" className="space-y-4 text-sm text-white/62">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white">
                  선택한 정보를 불러오는 중입니다
                </h2>
                <p className="mt-2 text-sm font-semibold text-white/58">
                  카탈로그와 로컬 캐시를 확인하고 있습니다.
                </p>
              </div>
              <div className="aspect-square animate-pulse rounded-md bg-white/10" />
              <div className="h-6 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          ) : null}

          {shouldShowUnavailableState ? (
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-black text-white">
                선택한 정보를 불러올 수 없습니다
              </h2>
              <p className="mt-2 text-sm font-semibold text-white/58">
                선택한 트랙은 현재 카탈로그와 로컬 캐시에 없습니다. 목록에서 다른 트랙을
                선택해 주세요.
              </p>
            </div>
          ) : null}

          {track ? (
            <div className="space-y-6">
              {canOpenArtworkFullscreen ? (
                <button
                  type="button"
                  aria-label={`Open ${track.title} artwork fullscreen`}
                  onClick={handleOpenArtworkFullscreen}
                  className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-md border border-white/10 bg-[#17070e] bg-cover bg-center text-left transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
                  style={{ backgroundImage: `url(${track.artworkUrl})` }}
                >
                  <span className="absolute right-3 top-3 z-[2] grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-black/42 text-white/76 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 size={17} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <AudioVisualizer
                    analyser={audioAnalyser}
                    isActive={isVisualizerActive}
                    isCurrentTrack={Boolean(isCurrentTrack)}
                    trackTitle={track.title}
                    artistName={track.artistName}
                    showHeader={false}
                    blendMode="screen"
                    activeOpacity={1}
                    pausedOpacity={0.72}
                    inactiveOpacity={0.35}
                  />
                </button>
              ) : (
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
                  <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <AudioVisualizer
                    analyser={audioAnalyser}
                    isActive={isVisualizerActive}
                    isCurrentTrack={Boolean(isCurrentTrack)}
                    trackTitle={track.title}
                    artistName={track.artistName}
                    showHeader={false}
                    blendMode="screen"
                    activeOpacity={1}
                    pausedOpacity={0.72}
                    inactiveOpacity={0.35}
                  />
                </div>
              )}

              <div className="min-w-0">
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

              <EqualizerPanel />

              <dl className="grid gap-2">
                <DetailLine label="Duration" value={formatDuration(track.durationMs)} />
                <DetailLine label="Source" value={track.source} />
                <DetailLine
                  label="GitHub"
                  value={
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 truncate font-semibold text-white/74 transition-colors hover:text-white"
                    >
                      <Link
                        size={14}
                        strokeWidth={2.1}
                        className="shrink-0 text-white/74"
                        aria-hidden="true"
                      />
                      Made by Lucas
                    </a>
                  }
                />
              </dl>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export default TrackDetailAside;
