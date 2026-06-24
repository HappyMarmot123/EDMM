import { NextResponse } from "next/server";
import { getAudiusHost } from "@/shared/api/audius/audiusClient";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const host = await getAudiusHost();
    const streamUrl = new URL(
      `/v1/tracks/${encodeURIComponent(id)}/stream`,
      host,
    );

    streamUrl.searchParams.set("app_name", "EDMM");

    return NextResponse.redirect(streamUrl);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
