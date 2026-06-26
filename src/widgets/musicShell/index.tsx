"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPlayable, type Track } from "@/entities/Track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import {
  getCachedTrack,
  getCachedTracks,
} from "@/shared/db/repositories/trackCacheRepo";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import TrackDetailAside from "./trackDetailAside";
import {
  dedupeIds,
  findTrackById,
  firstPlayableTrack,
  resolveInitialSeedTrack,
  resolveRecentSeedTrack,
} from "./trackSeedUtils";

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
const isResourceType = (value: ResourceTypeFilter | undefined): value is ResourceTypeFilter =>
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
  const [selectionSource, setSelectionSource] = useState<
    "initial" | "visible" | null
  >(normalizedInitialTrackId ? "initial" : null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const seededTrackIdRef = useRef<string | null>(null);
  const resolvedInitialTrackRef = useRef<string | null>(null);
  const resolvedRecentTrackRef = useRef<string | null>(null);

  useEffect(() => {
    setView(normalizedInitialView);
  }, [normalizedInitialView]);

  useEffect(() => {
    setSelectedTrackId(normalizedInitialTrackId);
    setSelectionSource(normalizedInitialTrackId ? "initial" : null);
    resolvedInitialTrackRef.current = null;
  }, [normalizedInitialTrackId]);

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
    selectionSource === "initial" ? selectedTrackId : visibleSelectedTrackId;

  const queueForTrack = useCallback(
    (track: Track) =>
      visibleTrackIds.has(track.id) ? visibleTracks : [track],
    [visibleTrackIds, visibleTracks],
  );

  const activateTrackInPlayer = useCallback(
    (
      track: Track,
      playImmediately = false,
      source: "initial" | "visible" = "visible",
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
      setIsDetailOpen(true);
    },
    [onPlay, queueForTrack],
  );

  const handleSelect = (track: Track) => {
    setSelectedTrackId(track.id);
    setSelectionSource("visible");
    setIsDetailOpen(true);
  };

  const handlePlay = (track: Track) => {
    activateTrackInPlayer(track, true, "visible", visibleTracks);
  };

  useEffect(() => {
    if (
      selectedTrackId &&
      selectionSource === "visible" &&
      !visibleTrackIds.has(selectedTrackId)
    ) {
      setSelectedTrackId(null);
      setSelectionSource(null);
      if (seededTrackIdRef.current === selectedTrackId) {
        seededTrackIdRef.current = null;
      }
    }
  }, [selectedTrackId, selectionSource, visibleTrackIds]);

  useEffect(() => {
    if (selectionSource !== "initial" || !selectedTrackId) {
      return;
    }

    if (resolvedInitialTrackRef.current === selectedTrackId) {
      return;
    }

    resolvedInitialTrackRef.current = selectedTrackId;
    let isActive = true;
    const fallbackToFirstPlayable = () => {
      const fallbackTrack = firstPlayableTrack(visibleTracks);
      if (!fallbackTrack) {
        setSelectionSource(null);
        setSelectedTrackId(null);
        resolvedInitialTrackRef.current = null;
        return;
      }

      activateTrackInPlayer(
        fallbackTrack,
        false,
        "initial",
        queueForTrack(fallbackTrack),
      );
    };

    if (selectedTrack) {
      if (!isPlayable(selectedTrack)) {
        fallbackToFirstPlayable();
        return;
      }

      activateTrackInPlayer(selectedTrack, false, "initial");
      return;
    }

    void (async () => {
      try {
        const cachedTrack = await getCachedTrack(selectedTrackId).catch(() => null);
        if (!isActive) {
          return;
        }

        const resolvedTrack = resolveInitialSeedTrack({
          selectedTrackId,
          selectedTrack,
          visibleTracks,
          cachedTrack: cachedTrack ?? null,
        });

        if (!resolvedTrack) {
          fallbackToFirstPlayable();
          return;
        }

        activateTrackInPlayer(
          resolvedTrack,
          false,
          "initial",
          queueForTrack(resolvedTrack),
        );
      } catch (error) {
        console.warn("Failed to resolve initial track from cache:", error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    activateTrackInPlayer,
    selectedTrack,
    selectedTrackId,
    selectionSource,
    visibleTracks,
  ]);

  useEffect(() => {
    if (selectionSource || seededTrackIdRef.current) {
      return;
    }

    const latestRecentId = recentTrackIds[0] ?? null;
    const firstVisibleTrackId = visibleTracks[0]?.id ?? null;
    const seedTrackId = latestRecentId || firstVisibleTrackId;

    if (!seedTrackId) {
      return;
    }

    const dedupeKey = latestRecentId
      ? `recent:${latestRecentId}:first:${firstVisibleTrackId ?? "none"}`
      : `first:${firstVisibleTrackId}`;
    if (resolvedRecentTrackRef.current === dedupeKey) {
      return;
    }
    resolvedRecentTrackRef.current = dedupeKey;

    let isActive = true;

    void (async () => {
      let track: Track | null = null;

      if (latestRecentId) {
        const cachedTrack = await getCachedTrack(latestRecentId).catch(() => null);
        track =
          resolveRecentSeedTrack({
            latestRecentId,
            visibleTracks,
            cachedTrack: cachedTrack ?? null,
          }) ?? null;
      } else {
        track = firstPlayableTrack(visibleTracks);
      }

      if (!isActive || !track || !isPlayable(track)) {
        return;
      }

      resolvedRecentTrackRef.current = dedupeKey;
      activateTrackInPlayer(track, false, "initial", queueForTrack(track));
    })();

    return () => {
      isActive = false;
    };
  }, [activateTrackInPlayer, queueForTrack, recentTrackIds, selectionSource, visibleTracks]);

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
      <section className="mx-auto grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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

        <aside aria-label="Track detail aside" className="xl:pb-0">
          {isDetailOpen ? (
            <TrackDetailAside
              selectedTrackId={detailSelectedTrackId}
              fallbackTrack={selectedTrack}
              queue={visibleTracks}
              onPlay={handlePlay}
              onClose={() => setIsDetailOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsDetailOpen(true)}
              className="w-full rounded-lg border border-white/10 bg-[#0b0609] px-4 py-3 text-sm font-black text-[#ffb8c0] transition-colors hover:border-[#ff98a2]/50 hover:bg-white/[0.05]"
              aria-label="Open track detail"
            >
              Open track detail
            </button>
          )}
        </aside>
      </section>
    </main>
  );
}

export default MusicShell;
