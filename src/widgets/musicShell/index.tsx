"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Track } from "@/entities/Track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import TrackDetailAside from "./trackDetailAside";
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
  initialResourceType?: ResourceTypeFilter;
}

type CachedTrackState = {
  tracks: Track[];
  isLoading: boolean;
};
const noop: NonNullable<MusicShellProps["onPlay"]> = () => {};

const isMusicView = (view: MusicView | undefined): view is MusicView =>
  view === "all" || view === "favorites" || view === "recent";
const isResourceType = (
  value: ResourceTypeFilter | undefined,
): value is ResourceTypeFilter =>
  value === "video" || value === "image" || value === "all";

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
  initialResourceType,
}: MusicShellProps) {
  const normalizedInitialView = isMusicView(initialView) ? initialView : "all";
  const [resourceType, setResourceType] = useState<ResourceTypeFilter>(
    isResourceType(initialResourceType) ? initialResourceType : "all",
  );
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
    resourceType === "video" ? undefined : { resourceType },
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
    <main className="min-h-screen bg-[#050306] px-4 pb-32 pt-5 text-white sm:px-6 lg:px-8">
      <section className="music-shell-grid mx-auto grid w-full gap-5">
        <section className="min-w-0 space-y-5">
          <MusicShellHeader
            query={query}
            view={view}
            resourceType={resourceType}
            resultCount={catalogTracks.length}
            favoriteCount={favoriteTrackIds.length}
            recentCount={recentTrackIds.length}
            onQueryChange={setQuery}
            onViewChange={setView}
            onResourceTypeChange={setResourceType}
          />

          <main
            aria-label="Music catalog"
            className="min-h-0 flex-1 rounded-lg border border-white/10 bg-black/24 p-3 sm:p-4"
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
          </main>

          <footer className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/58">
            <p className="font-semibold text-white/72">Now playing context</p>
            <p className="mt-1">
              Cloudinary catalog is the single runtime source. Favorites and recent
              play views are assembled from local cache.
            </p>
          </footer>
        </section>

          <aside aria-label="Track detail aside" className="min-w-0 pb-0">
            <TrackDetailAside
              selectedTrackId={detailSelectedTrackId}
              fallbackTrack={selectedTrack}
              queue={visibleTracks}
            onPlay={handlePlay}
          />
        </aside>
      </section>
    </main>
  );
}

export default MusicShell;
