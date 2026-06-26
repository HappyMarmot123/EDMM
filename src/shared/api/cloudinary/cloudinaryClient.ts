import type { Track } from "@/entities/track/model";
import {
  adaptCloudinaryTrack,
  type CloudinaryResource,
} from "./cloudinaryAdapter";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  expiresAt: number;
  tracks: Track[];
};

const responseCache = new Map<string, CacheEntry>();

const requiredEnv = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_AUDIO_FOLDER;

  if (!cloudName || !apiKey || !apiSecret || !folder) {
    throw new Error("Cloudinary configuration is missing");
  }

  return { cloudName, apiKey, apiSecret, folder };
};

const escapeExpressionValue = (value: string) => value.replace(/"/g, '\\"');

export function buildCloudinaryExpression(folder: string, query: string) {
  const base = `resource_type:video AND folder="${escapeExpressionValue(folder)}"`;
  const normalized = query.trim();

  if (!normalized) return base;

  const q = escapeExpressionValue(normalized);
  return `${base} AND (public_id:*${q}* OR filename:*${q}* OR tags:${q} OR context:${q} OR metadata:${q})`;
}

export function clearCloudinaryTrackCacheForTests() {
  responseCache.clear();
}

export async function fetchCloudinaryTracks(query = ""): Promise<Track[]> {
  const { cloudName, apiKey, apiSecret, folder } = requiredEnv();
  const normalizedQuery = query.trim();
  const cached = responseCache.get(normalizedQuery);

  if (cached && cached.expiresAt > Date.now()) return cached.tracks;

  const url = new URL(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
  );
  url.searchParams.set(
    "expression",
    buildCloudinaryExpression(folder, normalizedQuery),
  );
  url.searchParams.set("max_results", "100");
  url.searchParams.append("with_field", "tags");
  url.searchParams.append("with_field", "context");
  url.searchParams.append("with_field", "metadata");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cloudinary search failed with status ${response.status}`);
  }

  const body = (await response.json()) as { resources?: CloudinaryResource[] };
  const tracks = (body.resources ?? []).map(adaptCloudinaryTrack);
  responseCache.set(normalizedQuery, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    tracks,
  });

  return tracks;
}
