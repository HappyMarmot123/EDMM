import type { Track } from "@/entities/track/model";
import {
  adaptCloudinaryTrack,
  type CloudinaryResource,
} from "./cloudinaryAdapter";

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 100;
const MAX_RESULTS = 100;
const MAX_PAGES = 20;
const MAX_SEARCH_TOKENS = 8;
const SEARCH_TOKEN_REGEX = /[\p{L}\p{N}_-]+/gu;
const SEARCH_FIELDS = ["public_id", "filename", "tags", "context"] as const;

type CacheEntry = {
  expiresAt: number;
  tracks: Track[];
};

const responseCache = new Map<string, CacheEntry>();

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

const pruneCloudinaryTrackCache = (now: number) => {
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key);
  }

  while (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey === undefined) break;
    responseCache.delete(oldestKey);
  }
};

export function buildCloudinaryExpression(folder: string, query: string) {
  const normalizedFolder = folder.trim();
  const base = `resource_type:video AND (asset_folder="${escapeExpressionValue(normalizedFolder)}" OR folder="${escapeExpressionValue(normalizedFolder)}")`;
  const tokens = searchTokens(query);

  if (tokens.length === 0) return base;

  return `${base} AND ${tokens.map(searchExpressionForToken).join(" AND ")}`;
}

export function clearCloudinaryTrackCacheForTests() {
  responseCache.clear();
}

export async function fetchCloudinaryTracks(query = ""): Promise<Track[]> {
  assertServerEnvironment();

  const { cloudName, apiKey, apiSecret, folder } = requiredEnv();
  const normalizedQuery = query.trim();
  const now = Date.now();
  pruneCloudinaryTrackCache(now);

  const cached = responseCache.get(normalizedQuery);

  if (cached && cached.expiresAt > now) return cached.tracks;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const tracks: Track[] = [];
  const expression = buildCloudinaryExpression(folder, normalizedQuery);
  let nextCursor: string | null = null;
  let page = 0;

  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    );
    url.searchParams.set("expression", expression);
    url.searchParams.set("max_results", String(MAX_RESULTS));
    url.searchParams.append("with_field", "tags");
    url.searchParams.append("with_field", "context");

    if (nextCursor) {
      url.searchParams.set("next_cursor", nextCursor);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Cloudinary search failed with status ${response.status}`);
    }

    const body = (await response.json()) as {
      resources?: CloudinaryResource[];
      next_cursor?: string;
    };

    tracks.push(...(body.resources ?? []).map(adaptCloudinaryTrack));
    page += 1;
    nextCursor = body.next_cursor ?? null;
  } while (nextCursor && page < MAX_PAGES);

  if (page >= MAX_PAGES && nextCursor) {
    throw new Error("Cloudinary search pagination exceeded safety limit");
  }

  const fetchedAt = Date.now();

  responseCache.set(normalizedQuery, {
    expiresAt: fetchedAt + CACHE_TTL_MS,
    tracks,
  });
  pruneCloudinaryTrackCache(fetchedAt);

  return tracks;
}
