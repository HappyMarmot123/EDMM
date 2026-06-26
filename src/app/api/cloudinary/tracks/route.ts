import { NextResponse } from "next/server";
import { fetchCloudinaryTracks } from "@/shared/api/cloudinary/cloudinaryClient";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const resourceTypeParam = new URL(request.url).searchParams.get("resourceType");
  const resourceType = ["video", "image", "all"].includes(
    resourceTypeParam ?? "",
  )
    ? (resourceTypeParam as "video" | "image" | "all")
    : "video";

  try {
    return NextResponse.json(
      await fetchCloudinaryTracks(query, { resourceType }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Cloudinary configuration is missing" ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
