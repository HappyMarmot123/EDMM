"use client";

import { useEffect, useMemo, useState } from "react";
import type { Track } from "@/entities/track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import TrackDetailAside from "./trackDetailAside";

export interface MusicShellProps {
  onPlay?: (track: Track, queue?: Track[]) => void;
}

type CachedTrackState = {
  tracks: Track[];
  isLoading: boolean;
};

const noop: NonNullable<MusicShellProps["onPlay"]> = () => {};

const dedupeIds = (ids: Iterable<string>) => [...new Set(ids)];

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

export function MusicShell({ onPlay = noop }: MusicShellProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<MusicView>("all");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const normalizedQuery = query.trim();
  const {
    data: cloudinaryData,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch,
  } = useCloudinaryTracks(normalizedQuery);
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

    return visibleTracks.find((track) => track.id === selectedTrackId) ?? null;
  }, [selectedTrackId, visibleTracks]);
  const validSelectedTrackId = selectedTrack?.id ?? null;

  useEffect(() => {
    if (selectedTrackId && !visibleTrackIds.has(selectedTrackId)) {
      setSelectedTrackId(null);
    }
  }, [selectedTrackId, visibleTrackIds]);

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

  const handlePlay = (track: Track) => {
    onPlay(track, visibleTracks);
  };

  return (
    <main className="min-h-screen bg-[#050306] px-4 pb-32 pt-5 text-white sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[1440px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
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
            aria-label="Music catalog"
            className="rounded-lg border border-white/10 bg-black/24 p-3 sm:p-4"
          >
            <MusicTrackList
              tracks={visibleTracks}
              selectedTrackId={validSelectedTrackId}
              isLoading={isVisibleLoading}
              isError={isVisibleError}
              emptyMessage={emptyMessage}
              onSelect={(track) => setSelectedTrackId(track.id)}
              onPlay={handlePlay}
              onRetry={view === "all" ? () => void refetch?.() : undefined}
            />
          </section>
        </div>

        <TrackDetailAside
          selectedTrackId={validSelectedTrackId}
          fallbackTrack={selectedTrack}
          queue={visibleTracks}
          onPlay={onPlay}
        />
      </section>
    </main>
  );
}

export default MusicShell;
