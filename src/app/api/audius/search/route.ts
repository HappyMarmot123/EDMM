import { NextResponse } from "next/server";
import { searchAudiusTracks } from "@/shared/api/audius/audiusClient";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    return NextResponse.json(await searchAudiusTracks(q));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
