import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";

async function search(q: string): Promise<Track[]> {
  const res = await fetch(`/api/audius/search?q=${encodeURIComponent(q)}`);

  if (!res.ok) throw new Error("search failed");

  const tracks = (await res.json()) as Track[];
  tracks.forEach((track) => {
    cacheTrack(track).catch((error) => {
      console.warn("Failed to cache search track:", error);
    });
  });

  return tracks;
}

export function useTrackSearch(query: string) {
  const normalizedQuery = query.trim();
  const hydrated = useHydrated();

  return useQuery({
    queryKey: ["search", normalizedQuery],
    queryFn: () => search(normalizedQuery),
    enabled: hydrated && normalizedQuery.length > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
