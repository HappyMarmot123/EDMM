import { NextResponse } from "next/server";
import { getAudiusHost } from "@/shared/api/audius/audiusClient";

export const dynamic = "force-dynamic";

const STREAM_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
];

export async function GET(
  req: Request,
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

    const upstreamHeaders = new Headers();
    const range = req.headers.get("range");
    if (range) {
      upstreamHeaders.set("range", range);
    }

    const upstream = await fetch(streamUrl.toString(), {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Audius stream failed with status ${upstream.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    STREAM_RESPONSE_HEADERS.forEach((header) => {
      const value = upstream.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });
    headers.set("access-control-allow-origin", "*");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
