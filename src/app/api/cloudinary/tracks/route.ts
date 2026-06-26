import { NextResponse } from "next/server";
import { fetchCloudinaryTracks } from "@/shared/api/cloudinary/cloudinaryClient";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    return NextResponse.json(await fetchCloudinaryTracks(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Cloudinary configuration is missing" ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
