"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Track } from "@/entities/Track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import TrackDetailAside from "./trackDetailAside";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  dedupeIds,
  findTrackById,
  firstPlayableTrack,
} from "./trackSeedUtils";
import {
  SelectionSource,
  useMusicShellTrackSeed,
} from "./useMusicShellTrackSeed";

export interface MusicShellProps {
  onPlay?: (track: Track, queue?: Track[], playImmediately?: boolean) => void;
  initialView?: MusicView;
  initialTrackId?: string | null;
}

type CachedTrackState = {
  tracks: Track[];
  isLoading: boolean;
};
const noop: NonNullable<MusicShellProps["onPlay"]> = () => {};

const isMusicView = (view: MusicView | undefined): view is MusicView =>
  view === "all" || view === "favorites" || view === "recent";

function useCachedTrackList(ids: string[]): CachedTrackState {
  const [state, setState] = useState<CachedTrackState>({
    tracks: [],
    isLoading: false,
  });

  useEffect(() => {
    let isActive = true;

    if (ids.length === 0) {
      setState({ tracks: [], isLoading: false });
      return;
    }

    setState((current) => ({ ...current, isLoading: true }));
    getCachedTracks(ids)
      .then((tracks) => {
        if (isActive) {
          setState({ tracks, isLoading: false });
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ tracks: [], isLoading: false });
        }
      });

    return () => {
      isActive = false;
    };
  }, [ids]);

  return state;
}

export function MusicShell({
  onPlay = noop,
  initialView,
  initialTrackId = null,
}: MusicShellProps) {
  const normalizedInitialView = isMusicView(initialView) ? initialView : "all";
  const normalizedInitialTrackId =
    initialTrackId?.trim().length ? initialTrackId : null;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<MusicView>(normalizedInitialView);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    normalizedInitialTrackId,
  );
  const [selectionSource, setSelectionSource] = useState<SelectionSource | null>(
    normalizedInitialTrackId ? "initial" : null,
  );
  const [isTrackDetailOpen, setIsTrackDetailOpen] = useState(true);
  const currentTrackId = useAudioPlayer().currentTrack?.assetId ?? null;

  const seededTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    setView(normalizedInitialView);
  }, [normalizedInitialView]);

  useEffect(() => {
    if (normalizedInitialTrackId) {
      setSelectedTrackId(normalizedInitialTrackId);
      setSelectionSource("initial");
      return;
    }

    if (currentTrackId) {
      setSelectedTrackId((previousId) =>
        previousId === currentTrackId ? previousId : currentTrackId,
      );
      setSelectionSource("visible");
      return;
    }

    setSelectedTrackId(null);
    setSelectionSource(null);
  }, [currentTrackId, normalizedInitialTrackId]);

  const normalizedQuery = query.trim();
  const {
    data: cloudinaryData,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch,
  } = useCloudinaryTracks(
    normalizedQuery,
    { resourceType: "all" },
  );
  const catalogTracks = useMemo(() => cloudinaryData ?? [], [cloudinaryData]);

  const { favoriteIds } = useFavorites();
  const { recentIds } = useRecentPlays();

  const favoriteTrackIds = useMemo(
    () => dedupeIds(Array.from(favoriteIds)),
    [favoriteIds],
  );
  const recentTrackIds = useMemo(() => dedupeIds(recentIds), [recentIds]);

  const favoriteState = useCachedTrackList(favoriteTrackIds);
  const recentState = useCachedTrackList(recentTrackIds);

  const visibleTracks = useMemo(() => {
    if (view === "favorites") return favoriteState.tracks;
    if (view === "recent") return recentState.tracks;

    return catalogTracks;
  }, [catalogTracks, favoriteState.tracks, recentState.tracks, view]);

  const visibleTrackIds = useMemo(
    () => new Set(visibleTracks.map((track) => track.id)),
    [visibleTracks],
  );

  const selectedTrack = useMemo(() => {
    if (!selectedTrackId) return null;

    return findTrackById(visibleTracks, selectedTrackId);
  }, [selectedTrackId, visibleTracks]);
  const visibleSelectedTrackId = selectedTrack?.id ?? null;
  const detailSelectedTrackId =
    selectionSource === "initial" ? selectedTrackId : visibleSelectedTrackId ?? selectedTrackId;

  const queueForTrack = useCallback(
    (track: Track) =>
      visibleTrackIds.has(track.id) ? visibleTracks : [track],
    [visibleTrackIds, visibleTracks],
  );

  const activateTrackInPlayer = useCallback(
    (
      track: Track,
      playImmediately = false,
      source: SelectionSource = "visible",
      queueOverride?: Track[],
    ) => {
      if (!playImmediately && seededTrackIdRef.current === track.id) {
        return;
      }

      const queue = queueOverride ?? queueForTrack(track);

      seededTrackIdRef.current = track.id;
      onPlay(track, queue, playImmediately);
      setSelectedTrackId(track.id);
      setSelectionSource(source);
    },
    [onPlay, queueForTrack],
  );

  const handleSelect = (track: Track) => {
    setSelectedTrackId(track.id);
    setSelectionSource("visible");
  };

  const handlePlay = (track: Track) => {
    activateTrackInPlayer(track, true, "visible", queueForTrack(track));
  };

  const fallbackToFirstPlayable = useCallback(() => {
    const fallbackTrack = firstPlayableTrack(visibleTracks);

    if (!fallbackTrack) {
      setSelectedTrackId(null);
      setSelectionSource(null);
      return;
    }

    activateTrackInPlayer(fallbackTrack, false, "initial", queueForTrack(fallbackTrack));
  }, [activateTrackInPlayer, queueForTrack, visibleTracks]);

  useMusicShellTrackSeed({
    selectionSource,
    selectedTrackId,
    selectedTrack,
    visibleTracks,
    recentTrackIds,
    queueForTrack,
    activateTrackInPlayer,
    fallbackToFirstPlayable,
    seededTrackRef: seededTrackIdRef,
  });

  const isVisibleLoading =
    view === "all"
      ? isCatalogLoading
      : view === "favorites"
        ? favoriteState.isLoading
        : recentState.isLoading;
  const isVisibleError = view === "all" ? isCatalogError : false;
  const emptyMessage =
    view === "all"
      ? normalizedQuery
        ? `No tracks found for "${normalizedQuery}".`
        : "No tracks in this view."
      : "No tracks in this view.";
  return (
    <main
      className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#050306] px-4 pb-[calc(78px+max(env(safe-area-inset-bottom),10px))] pt-5 text-white sm:px-6 sm:pb-[calc(96px+max(env(safe-area-inset-bottom),12px))] lg:px-8"
    >
      <section className="music-shell-grid mx-auto grid min-h-0 w-full flex-1 gap-5">
        <main className="min-w-0 flex min-h-0 flex-1 flex-col gap-5">
          <MusicShellHeader
            query={query}
            view={view}
            resultCount={catalogTracks.length}
            favoriteCount={favoriteTrackIds.length}
            recentCount={recentTrackIds.length}
            onQueryChange={setQuery}
            onViewChange={setView}
          />

          <section
            aria-label="Track list section"
            className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/24 p-3 sm:p-4"
          >
            <MusicTrackList
              tracks={visibleTracks}
              selectedTrackId={visibleSelectedTrackId}
              isLoading={isVisibleLoading}
              isError={isVisibleError}
              emptyMessage={emptyMessage}
              onSelect={handleSelect}
              onPlay={handlePlay}
              onRetry={view === "all" ? () => void refetch?.() : undefined}
            />
          </section>
        </main>

        <section className="music-shell-aside-shell">
          <button
            type="button"
            onClick={() => setIsTrackDetailOpen((value) => !value)}
            aria-label={
              isTrackDetailOpen ? "Close track detail" : "Open track detail"
            }
            className="music-shell-aside__toggle rounded-full border border-white/15 bg-[#0b0609] px-2.5 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#ffb8c0] transition-colors hover:border-[#ff98a2]/55 hover:bg-white/5"
          >
            {isTrackDetailOpen ? (
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>

          <aside
            aria-label="Track detail aside"
            className={`min-w-0 h-full pb-0 ${
              isTrackDetailOpen
                ? "music-shell-aside music-shell-aside--open"
                : "music-shell-aside music-shell-aside--closed"
            }`}
          >
            <div className="music-shell-aside__content">
              <TrackDetailAside
                selectedTrackId={detailSelectedTrackId}
                fallbackTrack={selectedTrack}
                queue={visibleTracks}
                onPlay={handlePlay}
              />
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

export default MusicShell;
