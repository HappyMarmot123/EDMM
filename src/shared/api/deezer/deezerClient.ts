import type { Track } from "@/entities/track/model";

import { adaptDeezerTrack, type DeezerTrackRaw } from "./deezerAdapter";

interface DeezerSearchResponse {
  data?: unknown;
}

function isDeezerTrackRaw(raw: unknown): raw is DeezerTrackRaw {
  return typeof raw === "object" && raw !== null;
}

function hasDeezerId(
  raw: DeezerTrackRaw,
): raw is DeezerTrackRaw & { id: number | string } {
  return raw.id != null && String(raw.id).trim().length > 0;
}

export async function searchDeezer(q: string): Promise<Track[]> {
  const response = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}`,
  );

  if (!response.ok) {
    throw new Error("Deezer search failed");
  }

  const body = (await response.json()) as DeezerSearchResponse;

  if (!Array.isArray(body.data)) {
    throw new Error("Deezer search failed");
  }

  return body.data
    .filter(isDeezerTrackRaw)
    .filter(hasDeezerId)
    .map(adaptDeezerTrack);
}
