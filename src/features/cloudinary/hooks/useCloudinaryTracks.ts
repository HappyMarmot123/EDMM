import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track";
import { cacheTrack } from "@/shared/db";
import { useHydrated } from "@/shared/hooks/useHydrated";
import type { ResourceTypeFilter } from "@/shared/api/cloudinary/cloudinaryClient";
import type { CloudinaryTrackCategory } from "@/shared/api/cloudinary/cloudinaryCategory";
import { logger } from "@/shared/lib/logger";

type CloudinaryTrackQueryOptions = {
  resourceType?: ResourceTypeFilter;
  filterPlayable?: boolean;
  category?: CloudinaryTrackCategory;
};

const TRACK_LIST_BASE = "/api/cloudinary/tracks";
// 캐시 버스터 Latest 20260707
// 이전 HTTP 캐시(max-age + stale-while-revalidate) 엔트리를 우회한다.
const TRACK_LIST_CACHE_VERSION = "4";
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
  category?: CloudinaryTrackCategory,
) => {
  const params = new URLSearchParams();
  params.set("v", TRACK_LIST_CACHE_VERSION);

  if (resourceType === "all") {
    params.set("resourceType", resourceType);
  }

  if (query) {
    params.set("q", query);
  }

  if (includeFilterPlayable && filterPlayable !== undefined) {
    params.set("filterPlayable", filterPlayable ? "true" : "false");
  }

  if (category) {
    params.set("category", category);
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : "";
};

const toEndpoint = (resourceType: ResourceTypeFilter) => {
  return TRACK_LIST_ENDPOINTS[resourceType];
};

const shouldIncludeFilterPlayable = (resourceType: ResourceTypeFilter) => {
  return resourceType === "all" || resourceType === "video";
};

const toFetchUrl = (
  query: string,
  resourceType: ResourceTypeFilter,
  filterPlayable?: boolean,
  category?: CloudinaryTrackCategory,
) => {
  const suffix = toSearchParams(
    resourceType,
    query,
    shouldIncludeFilterPlayable(resourceType),
    filterPlayable,
    category,
  );

  return `${toEndpoint(resourceType)}${suffix}`;
};

const resolveTrackList = async (
  query: string,
  resourceType: ResourceTypeFilter,
  filterPlayable?: boolean,
  category?: CloudinaryTrackCategory,
) => {
  const response = await fetch(
    toFetchUrl(query, resourceType, filterPlayable, category),
  );
  if (!response.ok) throw new Error("cloudinary tracks fetch failed");

  const tracks = (await response.json()) as Track[];
  return tracks;
};

const cacheTracks = async (tracks: Track[]) => {
  const cacheResults = await Promise.allSettled(
    tracks.map((track) => cacheTrack(track)),
  );
  cacheResults.forEach((result) => {
    if (result.status === "rejected") {
      logger.warn("Failed to cache Cloudinary track:", result.reason);
    }
  });
};

const normalizeForMatching = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

const readMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getTrackPublicId = (track: Track) => {
  const metadata = track.metadata as Record<string, unknown> | undefined;
  const metadataContext = metadata?.cloudinaryMetadata;
  const cloudinaryMetadata =
    typeof metadataContext === "object" && metadataContext !== null
      ? (metadataContext as Record<string, unknown>)
      : undefined;

  const publicId =
    readMetadataString(metadata, "publicId") ??
    readMetadataString(metadata, "public_id") ??
    readMetadataString(cloudinaryMetadata, "public_id");

  if (!publicId) {
    return undefined;
  }

  const segments = publicId.split("/").filter(Boolean);
  const basename = segments.at(-1) ?? publicId;
  return normalizeForMatching(basename);
};

const buildMatchKeys = (track: Track) => {
  const keys = new Set<string>();
  const publicIdStem = getTrackPublicId(track);
  const title = normalizeForMatching(track.title);
  const artist = normalizeForMatching(track.artistName);
  const album = track.albumName
    ? normalizeForMatching(track.albumName)
    : undefined;

  if (publicIdStem) {
    keys.add(publicIdStem);
  }

  if (title) {
    keys.add(title);
    if (album) {
      keys.add(`${title} ${album}`.trim());
    }

    if (artist) {
      keys.add(`${artist} ${title}`.trim());
      keys.add(`${title} ${artist}`.trim());
    }
  }

  if (artist) {
    keys.add(artist);
  }

  if (album) {
    keys.add(album);
  }

  return [...keys].filter(Boolean);
};

const dedupeById = (tracks: Track[]) => {
  const seen = new Set<string>();

  return tracks.filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
};

const mergeImageTracksIntoVideos = (videos: Track[], images: Track[]) => {
  const dedupedVideos = dedupeById(videos);
  const imageByKey = new Map<string, string>();
  const imageTracksByKey: Record<string, Track> = {};

  for (const image of images) {
    for (const key of buildMatchKeys(image)) {
      if (!imageByKey.has(key)) {
        imageByKey.set(key, image.id);
        imageTracksByKey[image.id] = image;
      }
    }
  }

  const mergeArtwork = (video: Track, image: Track | undefined) => {
    if (!image || video.artworkUrl) {
      return video;
    }

    return {
      ...video,
      artworkUrl: image.artworkUrl || image.streamUrl || video.artworkUrl,
    };
  };

  return dedupedVideos.map((video) => {
    let match: Track | undefined;

    for (const key of buildMatchKeys(video)) {
      const imageId = imageByKey.get(key);
      if (imageId) {
        match = imageTracksByKey[imageId];
        break;
      }
    }

    return mergeArtwork(video, match);
  });
};

async function getCloudinaryTracks(
  query: string,
  options?: CloudinaryTrackQueryOptions,
): Promise<Track[]> {
  const resourceType = options?.resourceType ?? "video";
  const category = options?.category;

  if (resourceType === "all") {
    const [videoTracks, imageTracks] = await Promise.all([
      resolveTrackList(query, "video", options?.filterPlayable, category),
      resolveTrackList(query, "image", undefined, category),
    ]);
    const mergedVideos = mergeImageTracksIntoVideos(videoTracks, imageTracks);
    await cacheTracks([...mergedVideos, ...imageTracks]);

    return mergedVideos;
  }

  const tracks = await resolveTrackList(
    query,
    resourceType,
    options?.filterPlayable,
    category,
  );
  await cacheTracks(tracks);
  return tracks;
}

export function useCloudinaryTracks(
  query = "",
  options?: CloudinaryTrackQueryOptions,
) {
  const hydrated = useHydrated();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: [
      "cloudinary-tracks",
      TRACK_LIST_CACHE_VERSION,
      normalizedQuery,
      options?.resourceType ?? "video",
      options?.filterPlayable ?? null,
      options?.category ?? null,
    ],
    queryFn: () => getCloudinaryTracks(normalizedQuery, options),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
