"use client";

import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track";
import type {
  SyncedLyricLine,
  SyncedLyricsDocument,
} from "@/shared/lib/lyrics";

const LYRICS_ENDPOINT = "/api/lyrics";
const MAX_TRACK_ID_LENGTH = 512;
const MAX_NAME_LENGTH = 256;
const MAX_DURATION_MS = 24 * 60 * 60 * 1_000;
const LYRICS_REQUEST_ERROR = "Lyrics request failed";

export type LyricsTrack = Pick<
  Track,
  "id" | "title" | "artistName" | "albumName" | "durationMs"
>;

export type UseLyricsOptions = {
  enabled: boolean;
  eligible: boolean;
};

export type LyricsRequest = {
  trackId: string;
  trackName: string;
  artistName: string;
  durationMs: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readIdentityString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : undefined;
};

const toLyricsRequest = (
  track: LyricsTrack | null | undefined,
): LyricsRequest | undefined => {
  if (!track) return undefined;

  const trackId = readIdentityString(track.id, MAX_TRACK_ID_LENGTH);
  const trackName = readIdentityString(track.title, MAX_NAME_LENGTH);
  const artistName = readIdentityString(track.artistName, MAX_NAME_LENGTH);
  const durationMs = track.durationMs;

  if (
    !trackId ||
    !trackName ||
    !artistName ||
    !Number.isSafeInteger(durationMs) ||
    durationMs <= 0 ||
    durationMs > MAX_DURATION_MS
  ) {
    return undefined;
  }

  return { trackId, trackName, artistName, durationMs };
};

const isValidLine = (
  value: unknown,
  durationMs: number,
): value is SyncedLyricLine => {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.startMs) &&
    Number.isSafeInteger(value.endMs) &&
    typeof value.startMs === "number" &&
    typeof value.endMs === "number" &&
    value.startMs >= 0 &&
    value.endMs > value.startMs &&
    value.endMs <= durationMs &&
    typeof value.text === "string" &&
    value.text.trim().length > 0
  );
};

const isValidLyricsDocument = (
  value: unknown,
  request: LyricsRequest,
): value is SyncedLyricsDocument => {
  if (
    !isRecord(value) ||
    value.trackId !== request.trackId ||
    value.source !== "lrclib" ||
    !Number.isSafeInteger(value.providerId) ||
    typeof value.providerId !== "number" ||
    value.providerId <= 0 ||
    typeof value.instrumental !== "boolean" ||
    value.durationMs !== request.durationMs ||
    !Array.isArray(value.lines)
  ) {
    return false;
  }

  if (value.instrumental) {
    return value.lines.length === 0;
  }

  if (value.lines.length === 0) {
    return false;
  }

  let previousStartMs = -1;
  for (const line of value.lines) {
    if (!isValidLine(line, request.durationMs)) return false;
    if (line.startMs < previousStartMs) return false;
    previousStartMs = line.startMs;
  }

  return true;
};

const toLyricsUrl = (request: LyricsRequest) => {
  const searchParams = new URLSearchParams({
    trackId: request.trackId,
    trackName: request.trackName,
    artistName: request.artistName,
    durationMs: String(request.durationMs),
  });

  return `${LYRICS_ENDPOINT}?${searchParams.toString()}`;
};

const genericRequestError = () => new Error(LYRICS_REQUEST_ERROR);

export const fetchLyrics = async (
  request: LyricsRequest,
  signal?: AbortSignal,
): Promise<SyncedLyricsDocument | null> => {
  let response: Response;

  try {
    response = await fetch(toLyricsUrl(request), { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw genericRequestError();
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw genericRequestError();
  }

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw genericRequestError();
  }

  if (!isValidLyricsDocument(value, request)) {
    throw genericRequestError();
  }

  return value;
};

const lyricsQueryKey = (request: LyricsRequest | undefined) =>
  [
    "lyrics",
    request?.trackId ?? null,
    request?.trackName ?? null,
    request?.artistName ?? null,
    request?.durationMs ?? null,
  ] as const;

export function useLyrics(
  track: LyricsTrack | null | undefined,
  options: UseLyricsOptions,
) {
  const request = toLyricsRequest(track);
  const isPop = track?.albumName?.trim().toLowerCase() === "pop";
  const shouldFetch =
    options.enabled && options.eligible && isPop && request !== undefined;

  return useQuery({
    queryKey: lyricsQueryKey(request),
    queryFn: ({ signal }) => {
      if (!request) {
        return Promise.reject(genericRequestError());
      }

      return fetchLyrics(request, signal);
    },
    enabled: shouldFetch,
    placeholderData: undefined,
    retry: (failureCount) => failureCount < 1,
  });
}
