import { revalidateTag } from "next/cache";
import type { Track } from "@/entities/track";
import {
  adaptCloudinaryTrack,
  type CloudinaryResource,
} from "./cloudinaryAdapter";

export type ResourceTypeFilter = "video" | "image" | "all";

const VIDEO_MAX_RESULTS = 100;
const IMAGE_MAX_RESULTS = 100;
const ALL_MAX_RESULTS = 100;
const CLOUDINARY_TRACK_CACHE_TTL_MS = 86_400_000;
const CLOUDINARY_TRACK_BROWSER_CACHE_TTL_MS = 300_000;
const CLOUDINARY_TRACK_STALE_TTL_MS = 604_800_000;
const MAX_PAGES = 20;
const MAX_SEARCH_TOKENS = 8;
const SEARCH_TOKEN_REGEX = /[\p{L}\p{N}_-]+/gu;
const SEARCH_FIELDS = ["public_id", "filename", "tags", "context"] as const;
export const CLOUDINARY_TRACKS_CACHE_TAG = "cloudinary-tracks";

export type CloudinaryCachePolicy = {
  cacheTtlMs: number;
  browserCacheTtlMs?: number;
  staleWhileRevalidateMs?: number;
  maxResults?: number;
};

const policyByResourceType: Record<ResourceTypeFilter, CloudinaryCachePolicy> = {
  video: {
    cacheTtlMs: CLOUDINARY_TRACK_CACHE_TTL_MS,
    browserCacheTtlMs: CLOUDINARY_TRACK_BROWSER_CACHE_TTL_MS,
    staleWhileRevalidateMs: CLOUDINARY_TRACK_STALE_TTL_MS,
    maxResults: VIDEO_MAX_RESULTS,
  },
  image: {
    cacheTtlMs: CLOUDINARY_TRACK_CACHE_TTL_MS,
    browserCacheTtlMs: CLOUDINARY_TRACK_BROWSER_CACHE_TTL_MS,
    staleWhileRevalidateMs: CLOUDINARY_TRACK_STALE_TTL_MS,
    maxResults: IMAGE_MAX_RESULTS,
  },
  all: {
    cacheTtlMs: CLOUDINARY_TRACK_CACHE_TTL_MS,
    browserCacheTtlMs: CLOUDINARY_TRACK_BROWSER_CACHE_TTL_MS,
    staleWhileRevalidateMs: CLOUDINARY_TRACK_STALE_TTL_MS,
    maxResults: ALL_MAX_RESULTS,
  },
};

const assertServerEnvironment = () => {
  const hasNodeProcess =
    typeof process !== "undefined" && Boolean(process.versions?.node);

  if (
    typeof window !== "undefined" &&
    typeof window.document !== "undefined" &&
    !hasNodeProcess
  ) {
    throw new Error("Cloudinary client can only be used on the server");
  }
};

const requiredEnv = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_AUDIO_FOLDER?.trim() ?? "";

  if (!cloudName || !apiKey || !apiSecret || !folder) {
    throw new Error("Cloudinary configuration is missing");
  }

  return { cloudName, apiKey, apiSecret, folder };
};

const escapeExpressionValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const searchTokens = (query: string) =>
  (query.match(SEARCH_TOKEN_REGEX) ?? []).slice(0, MAX_SEARCH_TOKENS);

const searchExpressionForToken = (token: string) =>
  `(${SEARCH_FIELDS.map((field) => `${field}:${token}*`).join(" OR ")})`;

type FetchCloudinaryTrackOptions = {
  resourceType?: ResourceTypeFilter;
  filterPlayable?: boolean;
  cachePolicy?: CloudinaryCachePolicy;
};

const getCloudinaryTrackPolicy = (
  resourceType: ResourceTypeFilter,
): CloudinaryCachePolicy => {
  const defaultPolicy = policyByResourceType[resourceType];

  return defaultPolicy;
};

const isPlayableCloudinaryTrack = (track: Track) => {
  const resourceType =
    typeof track.metadata?.resourceType === "string"
      ? track.metadata.resourceType
      : "video";

  return resourceType.toLowerCase() !== "image";
};

export function buildCloudinaryExpression(
  folder: string,
  query: string,
  resourceType: ResourceTypeFilter = "video",
) {
  const normalizedFolder = folder.trim();
  const resourceTypeExpression =
    resourceType === "all"
      ? "(resource_type:video OR resource_type:image)"
      : `resource_type:${resourceType}`;
  const base = `${resourceTypeExpression} AND (asset_folder="${escapeExpressionValue(normalizedFolder)}" OR folder="${escapeExpressionValue(normalizedFolder)}")`;
  const tokens = searchTokens(query);

  if (tokens.length === 0) return base;

  return `${base} AND ${tokens.map(searchExpressionForToken).join(" AND ")}`;
}

export function clearCloudinaryTrackCacheForTests() {
  // Next Data Cache is managed by Next.js. Unit tests mock fetch directly and
  // keep this helper as a stable test boundary for older call sites.
}

export function revalidateCloudinaryTrackCache() {
  revalidateTag(CLOUDINARY_TRACKS_CACHE_TAG, "max");
}

export const getCloudinaryTrackCachePolicy = (
  resourceType: ResourceTypeFilter,
): CloudinaryCachePolicy => {
  return getCloudinaryTrackPolicy(resourceType);
};

export const buildCloudinaryCacheHeader = (
  policy: CloudinaryCachePolicy,
) => {
  const sharedMaxAgeSeconds = Math.max(1, Math.floor(policy.cacheTtlMs / 1000));
  const browserMaxAgeSeconds = Math.max(
    1,
    Math.floor((policy.browserCacheTtlMs ?? policy.cacheTtlMs) / 1000),
  );
  const staleWhileRevalidateSeconds = Math.max(
    1,
    Math.floor((policy.staleWhileRevalidateMs ?? policy.cacheTtlMs) / 1000),
  );

  return `public, max-age=${browserMaxAgeSeconds}, s-maxage=${sharedMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`;
};

export async function fetchCloudinaryTracks(
  query = "",
  options: FetchCloudinaryTrackOptions = {},
): Promise<Track[]> {
  assertServerEnvironment();

  const { cloudName, apiKey, apiSecret, folder } = requiredEnv();
  const normalizedQuery = query.trim();
  const resourceType = options?.resourceType ?? "video";
  const filterPlayable = options.filterPlayable ?? false;
  const cachePolicy =
    options.cachePolicy ?? getCloudinaryTrackPolicy(resourceType);
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const tracks: Track[] = [];
  const expression = buildCloudinaryExpression(folder, normalizedQuery, resourceType);
  let nextCursor: string | null = null;
  let page = 0;

  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    );
    url.searchParams.set("expression", expression);
    url.searchParams.set(
      "max_results",
      String(cachePolicy.maxResults ?? 100),
    );
    url.searchParams.append("with_field", "tags");
    url.searchParams.append("with_field", "context");

    if (nextCursor) {
      url.searchParams.set("next_cursor", nextCursor);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "force-cache",
      next: {
        revalidate: Math.max(1, Math.floor(cachePolicy.cacheTtlMs / 1000)),
        tags: [CLOUDINARY_TRACKS_CACHE_TAG],
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudinary search failed with status ${response.status}`);
    }

    const body = (await response.json()) as {
      resources?: CloudinaryResource[];
      next_cursor?: string;
    };

    const mappedTracks = (body.resources ?? []).map(adaptCloudinaryTrack);
    const filtered = filterPlayable
      ? mappedTracks.filter(isPlayableCloudinaryTrack)
      : mappedTracks;

    tracks.push(...filtered);
    page += 1;
    nextCursor = body.next_cursor ?? null;
  } while (nextCursor && page < MAX_PAGES);

  if (page >= MAX_PAGES && nextCursor) {
    throw new Error("Cloudinary search pagination exceeded safety limit");
  }

  return tracks;
}
