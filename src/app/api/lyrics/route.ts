import { NextResponse } from "next/server";
import { findLrclibLyrics } from "@/shared/api/lyrics/lrclibClient";
import { parseLrc, type SyncedLyricsDocument } from "@/shared/lib/lyrics";

const SUCCESS_CACHE_CONTROL =
  "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
const NOT_FOUND_CACHE_CONTROL =
  "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";
const NO_STORE_CACHE_CONTROL = "no-store";
const MAX_TRACK_ID_LENGTH = 512;
const MAX_NAME_LENGTH = 256;
const MAX_DURATION_MS = 24 * 60 * 60 * 1_000;

type LyricsRequest = {
  trackId: string;
  trackName: string;
  artistName: string;
  durationMs: number;
};

const singleParameter = (params: URLSearchParams, key: string) => {
  const values = params.getAll(key);
  if (values.length !== 1) return undefined;

  const value = values[0].trim();
  return value || undefined;
};

const parseLyricsRequest = (url: URL): LyricsRequest | undefined => {
  const trackId = singleParameter(url.searchParams, "trackId");
  const trackName = singleParameter(url.searchParams, "trackName");
  const artistName = singleParameter(url.searchParams, "artistName");
  const rawDurationMs = singleParameter(url.searchParams, "durationMs");

  if (
    !trackId ||
    !trackName ||
    !artistName ||
    !rawDurationMs ||
    trackId.length > MAX_TRACK_ID_LENGTH ||
    trackName.length > MAX_NAME_LENGTH ||
    artistName.length > MAX_NAME_LENGTH ||
    !/^\d+$/.test(rawDurationMs)
  ) {
    return undefined;
  }

  const durationMs = Number(rawDurationMs);
  if (
    !Number.isSafeInteger(durationMs) ||
    durationMs <= 0 ||
    durationMs > MAX_DURATION_MS
  ) {
    return undefined;
  }

  return { trackId, trackName, artistName, durationMs };
};

const json = (
  body: unknown,
  status: number,
  cacheControl: string,
) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": cacheControl },
  });

export async function GET(request: Request) {
  const lyricsRequest = parseLyricsRequest(new URL(request.url));

  if (!lyricsRequest) {
    return json({ error: "Invalid lyrics request" }, 400, NO_STORE_CACHE_CONTROL);
  }

  try {
    const match = await findLrclibLyrics({
      trackName: lyricsRequest.trackName,
      artistName: lyricsRequest.artistName,
      durationMs: lyricsRequest.durationMs,
    });

    if (!match) {
      return json(
        { error: "Synced lyrics not found" },
        404,
        NOT_FOUND_CACHE_CONTROL,
      );
    }

    const document: SyncedLyricsDocument = {
      trackId: lyricsRequest.trackId,
      source: "lrclib",
      providerId: match.providerId,
      instrumental: match.instrumental,
      durationMs: lyricsRequest.durationMs,
      lines: match.instrumental
        ? []
        : parseLrc(match.syncedLyrics ?? "", lyricsRequest.durationMs),
    };

    return json(document, 200, SUCCESS_CACHE_CONTROL);
  } catch {
    return json(
      { error: "Lyrics provider unavailable" },
      502,
      NO_STORE_CACHE_CONTROL,
    );
  }
}
