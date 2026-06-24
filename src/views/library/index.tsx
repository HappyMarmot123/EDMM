"use client";

import { useEffect, useMemo, useState } from "react";
import type { Track } from "@/entities/track/model";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import { TrackList } from "@/widgets/trackList";

export interface LibraryViewProps {
  onPlay?: (track: Track) => void;
}

const noop = () => {};

export function LibraryView({ onPlay = noop }: LibraryViewProps) {
  const { favoriteIds } = useFavorites();
  const { recentIds } = useRecentPlays();

  const dedupedFavoriteIds = useMemo(
    () => [...new Set(Array.from(favoriteIds))],
    [favoriteIds],
  );
  const favoriteIdLookup = useMemo(
    () => new Set(dedupedFavoriteIds),
    [dedupedFavoriteIds],
  );
  const dedupedRecentIds = useMemo(
    () => [...new Set(recentIds)].filter((id) => !favoriteIdLookup.has(id)),
    [recentIds, favoriteIdLookup],
  );

  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isRecentLoading, setIsRecentLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const ids = dedupedFavoriteIds;

    if (ids.length === 0) {
      setFavoriteTracks([]);
      setIsFavoriteLoading(false);
      return;
    }

    setIsFavoriteLoading(true);
    getCachedTracks(ids)
      .then((tracks) => {
        if (isActive) {
          setFavoriteTracks(tracks);
        }
      })
      .catch(() => {
        if (isActive) {
          setFavoriteTracks([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsFavoriteLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [dedupedFavoriteIds]);

  useEffect(() => {
    let isActive = true;
    const ids = dedupedRecentIds;

    if (ids.length === 0) {
      setRecentTracks([]);
      setIsRecentLoading(false);
      return;
    }

    setIsRecentLoading(true);
    getCachedTracks(ids)
      .then((tracks) => {
        if (isActive) {
          setRecentTracks(tracks);
        }
      })
      .catch(() => {
        if (isActive) {
          setRecentTracks([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsRecentLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [dedupedRecentIds]);

  return (
    <main className="bg-black min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold">Library</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <TrackList
            tracks={favoriteTracks}
            onPlay={onPlay}
            isLoading={isFavoriteLoading}
          />
        </section>

        {dedupedRecentIds.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Recent Plays</h2>
            <TrackList
              tracks={recentTracks}
              onPlay={onPlay}
              isLoading={isRecentLoading}
            />
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default LibraryView;
