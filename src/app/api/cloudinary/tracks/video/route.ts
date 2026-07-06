import { NextResponse } from "next/server";
import {
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
} from "@/shared/api/cloudinary/cloudinaryClient";
import { parseCloudinaryCategory } from "@/shared/api/cloudinary/cloudinaryCategory";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q") ?? "";
  const category = parseCloudinaryCategory(
    requestUrl.searchParams.get("category"),
  );
  const cachePolicy = getCloudinaryTrackCachePolicy("video");

  try {
    const tracks = await fetchCloudinaryTracks(query, {
      resourceType: "video",
      ...(category ? { category } : {}),
    });

    return NextResponse.json(tracks, {
      headers: {
        "Cache-Control": buildCloudinaryCacheHeader(cachePolicy),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Cloudinary configuration is missing" ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
