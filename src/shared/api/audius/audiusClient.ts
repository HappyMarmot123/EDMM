import type { Track } from "@/entities/track/model";
import { adaptAudiusTrack, type AudiusTrackRaw } from "./audiusAdapter";

const APP_NAME = "EDMM";
let cachedHost: string | null = null;

export async function getAudiusHost(): Promise<string> {
  if (cachedHost) return cachedHost;
  const res = await fetch("https://api.audius.co");
  if (!res.ok) throw new Error("Audius host discovery failed");
  const { data } = (await res.json()) as { data?: unknown };
  const host = Array.isArray(data) ? data[0] : null;
  if (typeof host !== "string" || host.trim() === "") {
    throw new Error("Audius host discovery failed");
  }
  try {
    new URL(host);
  } catch {
    throw new Error("Audius host discovery failed");
  }
  cachedHost = host;
  return cachedHost;
}

export async function fetchTrending(genre?: string): Promise<Track[]> {
  const host = await getAudiusHost();
  const url = new URL("/v1/tracks/trending", host);
  url.searchParams.set("app_name", APP_NAME);
  if (genre) url.searchParams.set("genre", genre);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Audius trending failed");
  const { data } = (await res.json()) as { data: AudiusTrackRaw[] };
  return data.map(adaptAudiusTrack);
}

export async function searchAudiusTracks(query: string): Promise<Track[]> {
  const host = await getAudiusHost();
  const url = new URL("/v1/tracks/search", host);
  url.searchParams.set("app_name", APP_NAME);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Audius search failed");
  const { data } = (await res.json()) as { data: AudiusTrackRaw[] };
  return data.map(adaptAudiusTrack);
}

export function __resetAudiusHostCacheForTests(): void {
  cachedHost = null;
}
