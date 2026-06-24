import { NextResponse } from "next/server";
import { fetchTrending } from "@/shared/api/audius/audiusClient";

export async function GET(req: Request) {
  const genre = new URL(req.url).searchParams.get("genre") ?? undefined;

  try {
    return NextResponse.json(await fetchTrending(genre));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
