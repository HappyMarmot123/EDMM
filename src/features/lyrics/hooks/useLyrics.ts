import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "@/shared/hooks/useHydrated";

async function getLyrics(artist: string, title: string): Promise<string | null> {
  const res = await fetch(
    `/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
  );

  if (!res.ok) return null;

  return (await res.json()).lyrics ?? null;
}

export function useLyrics(artist: string, title: string) {
  const normalizedArtist = artist.trim();
  const normalizedTitle = title.trim();
  const hydrated = useHydrated();

  return useQuery({
    queryKey: ["lyrics", normalizedArtist, normalizedTitle],
    queryFn: () => getLyrics(normalizedArtist, normalizedTitle),
    enabled:
      hydrated && normalizedArtist.length > 0 && normalizedTitle.length > 0,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60_000,
  });
}
