import { fetchLyrics } from "../../../shared/api/lyrics/lyricsClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") ?? "";
  const title = searchParams.get("title") ?? "";

  try {
    return Response.json({ lyrics: await fetchLyrics(artist, title) });
  } catch {
    return Response.json({ lyrics: null });
  }
}
