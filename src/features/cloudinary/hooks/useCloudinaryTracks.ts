import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";

type ResourceTypeFilter = "video" | "image" | "all";
type CloudinaryTrackQueryOptions = {
  resourceType?: ResourceTypeFilter;
  filterPlayable?: boolean;
};

const toSearchParams = (query: string, options?: CloudinaryTrackQueryOptions) => {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const params = new URLSearchParams(suffix ? suffix.slice(1) : undefined);

  if (options?.resourceType) {
    params.set("resourceType", options.resourceType);
  }

  if (options?.filterPlayable !== undefined) {
    params.set("filterPlayable", options.filterPlayable ? "true" : "false");
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

async function getCloudinaryTracks(
  query: string,
  options?: CloudinaryTrackQueryOptions,
): Promise<Track[]> {
  const suffix = toSearchParams(query, {
    ...options,
    filterPlayable: options?.filterPlayable,
  });
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

export function useCloudinaryTracks(query = "", options?: CloudinaryTrackQueryOptions) {
  const hydrated = useHydrated();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: [
      "cloudinary-tracks",
      normalizedQuery,
      options?.resourceType ?? "video",
      options?.filterPlayable ?? null,
    ],
    queryFn: () => getCloudinaryTracks(normalizedQuery, options),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
