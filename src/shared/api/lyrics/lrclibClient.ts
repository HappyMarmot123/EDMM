const LRCLIB_SEARCH_URL = "https://lrclib.net/api/search";
const LRCLIB_TIMEOUT_MS = 5_000;
const LRCLIB_CACHE_SECONDS = 86_400;
const MAX_DURATION_DIFFERENCE_MS = 2_000;

type LyricsLookup = {
  trackName: string;
  artistName: string;
  durationMs: number;
};

type LrclibCandidate = {
  id: number;
  trackName: string;
  artistName: string;
  duration: number;
  instrumental: boolean;
  syncedLyrics: string | null;
};

export type LrclibLyricsMatch = {
  providerId: number;
  instrumental: boolean;
  syncedLyrics: string | null;
};

export class LyricsProviderError extends Error {
  constructor() {
    super("Lyrics provider request failed");
    this.name = "LyricsProviderError";
  }
}

const normalizeMatchText = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

const containsNormalizedPhrase = (container: string, phrase: string) =>
  Boolean(container && phrase) &&
  ` ${container} `.includes(` ${phrase} `);

const isLrclibCandidate = (value: unknown): value is LrclibCandidate => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(candidate.id) &&
    Number(candidate.id) > 0 &&
    typeof candidate.trackName === "string" &&
    typeof candidate.artistName === "string" &&
    typeof candidate.duration === "number" &&
    Number.isFinite(candidate.duration) &&
    candidate.duration > 0 &&
    typeof candidate.instrumental === "boolean" &&
    (typeof candidate.syncedLyrics === "string" ||
      candidate.syncedLyrics === null)
  );
};

export async function findLrclibLyrics({
  trackName,
  artistName,
  durationMs,
}: LyricsLookup): Promise<LrclibLyricsMatch | null> {
  const url = new URL(LRCLIB_SEARCH_URL);
  url.searchParams.set("track_name", trackName);
  url.searchParams.set("artist_name", artistName);

  let response: Response;
  let payload: unknown;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "EDMM/0.1.0 (https://github.com/HappyMarmot123/EDMM)",
      },
      cache: "force-cache",
      next: { revalidate: LRCLIB_CACHE_SECONDS },
      signal: AbortSignal.timeout(LRCLIB_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new LyricsProviderError();
    }

    payload = await response.json();
  } catch (error) {
    if (error instanceof LyricsProviderError) throw error;
    throw new LyricsProviderError();
  }

  if (!Array.isArray(payload)) {
    throw new LyricsProviderError();
  }

  const requestedTitle = normalizeMatchText(trackName);
  const requestedArtist = normalizeMatchText(artistName);

  const eligible = payload
    .filter(isLrclibCandidate)
    .map((candidate) => {
      const candidateTitle = normalizeMatchText(candidate.trackName);
      const candidateArtist = normalizeMatchText(candidate.artistName);
      const durationDifferenceMs = Math.abs(
        candidate.duration * 1_000 - durationMs,
      );
      const hasArtistMatch =
        containsNormalizedPhrase(candidateArtist, requestedArtist) ||
        containsNormalizedPhrase(requestedArtist, candidateArtist);
      const hasSynchronizedLyrics = Boolean(candidate.syncedLyrics?.trim());

      if (
        !requestedTitle ||
        candidateTitle !== requestedTitle ||
        !hasArtistMatch ||
        durationDifferenceMs > MAX_DURATION_DIFFERENCE_MS ||
        (!candidate.instrumental && !hasSynchronizedLyrics)
      ) {
        return null;
      }

      return {
        candidate,
        durationDifferenceMs,
        exactArtist: candidateArtist === requestedArtist,
      };
    })
    .filter(
      (
        value,
      ): value is {
        candidate: LrclibCandidate;
        durationDifferenceMs: number;
        exactArtist: boolean;
      } => value !== null,
    )
    .sort(
      (left, right) =>
        left.durationDifferenceMs - right.durationDifferenceMs ||
        Number(right.exactArtist) - Number(left.exactArtist) ||
        left.candidate.id - right.candidate.id,
    );

  const match = eligible[0]?.candidate;
  if (!match) return null;

  return {
    providerId: match.id,
    instrumental: match.instrumental,
    syncedLyrics: match.syncedLyrics?.trim() || null,
  };
}
