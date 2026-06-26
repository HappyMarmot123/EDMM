import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";

async function getCloudinaryTracks(query: string): Promise<Track[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`/api/cloudinary/tracks${suffix}`);

  if (!response.ok) throw new Error("cloudinary tracks fetch failed");

  const tracks = (await response.json()) as Track[];
  const cacheResults = await Promise.allSettled(
    tracks.map((track) => cacheTrack(track)),
  );
  cacheResults.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Failed to cache Cloudinary track:", result.reason);
    }
  });

  return tracks;
}

export function useCloudinaryTracks(query = "") {
  const hydrated = useHydrated();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["cloudinary-tracks", normalizedQuery],
    queryFn: () => getCloudinaryTracks(normalizedQuery),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
