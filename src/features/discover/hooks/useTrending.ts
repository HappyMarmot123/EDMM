import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";

async function getTrending(normalizedGenre: string): Promise<Track[]> {
  const genreParam = normalizedGenre
    ? `?genre=${encodeURIComponent(normalizedGenre)}`
    : "";
  const res = await fetch(`/api/audius/trending${genreParam}`);

  if (!res.ok) throw new Error("trending fetch failed");

  const tracks = (await res.json()) as Track[];
  const cacheResults = await Promise.allSettled(tracks.map(cacheTrack));
  cacheResults.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Failed to cache trending track:", result.reason);
    }
  });

  return tracks;
}

export function useTrending(genre?: string) {
  const normalizedGenre = genre?.trim() ?? "";
  const hydrated = useHydrated();

  return useQuery({
    queryKey: ["trending", normalizedGenre || null],
    queryFn: () => getTrending(normalizedGenre),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
