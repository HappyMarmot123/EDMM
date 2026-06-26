import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";

type CloudinaryTrackQueryOptions = {
  resourceType?: ResourceTypeFilter;
  filterPlayable?: boolean;
};

const TRACK_LIST_BASE = "/api/cloudinary/tracks";
const TRACK_LIST_ENDPOINTS: Record<ResourceTypeFilter, string> = {
  video: `${TRACK_LIST_BASE}/video`,
  image: `${TRACK_LIST_BASE}/image`,
  all: TRACK_LIST_BASE,
};

const toSearchParams = (
  resourceType: ResourceTypeFilter,
  query: string,
  includeFilterPlayable: boolean,
  filterPlayable?: boolean,
) => {
  const params = new URLSearchParams();

  if (resourceType === "all") {
    params.set("resourceType", resourceType);
  }

  if (query) {
    params.set("q", query);
  }

  if (includeFilterPlayable && filterPlayable !== undefined) {
    params.set("filterPlayable", filterPlayable ? "true" : "false");
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : "";
};

const toEndpoint = (options?: CloudinaryTrackQueryOptions) => {
  const resourceType = options?.resourceType ?? "video";
  return TRACK_LIST_ENDPOINTS[resourceType];
};

const shouldIncludeFilterPlayable = (resourceType: ResourceTypeFilter) => {
  return resourceType === "all";
};

const toFetchUrl = (query: string, options?: CloudinaryTrackQueryOptions) => {
  const resourceType = options?.resourceType ?? "video";
  const suffix = toSearchParams(
    resourceType,
    query,
    shouldIncludeFilterPlayable(resourceType),
    options?.filterPlayable,
  );

  return `${toEndpoint({ ...options, resourceType })}${suffix}`;
};

async function getCloudinaryTracks(
  query: string,
  options?: CloudinaryTrackQueryOptions,
): Promise<Track[]> {
  const response = await fetch(toFetchUrl(query, options));

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
