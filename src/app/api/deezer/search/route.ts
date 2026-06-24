import { NextResponse } from "next/server";

import { searchDeezer } from "@/shared/api/deezer/deezerClient";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    return NextResponse.json(await searchDeezer(q));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
