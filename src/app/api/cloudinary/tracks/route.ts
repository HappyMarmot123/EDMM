import { NextResponse } from "next/server";
import { fetchCloudinaryTracks } from "@/shared/api/cloudinary/cloudinaryClient";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q") ?? "";
  const resourceTypeParam = requestUrl.searchParams.get("resourceType");
  const filterPlayableParam = requestUrl.searchParams.get("filterPlayable");
  const filterPlayable =
    filterPlayableParam === null ? undefined : filterPlayableParam === "true";
  const resourceType = ["video", "image", "all"].includes(
    resourceTypeParam ?? "",
  )
    ? (resourceTypeParam as "video" | "image" | "all")
    : "video";

  try {
    return NextResponse.json(
      await fetchCloudinaryTracks(query, { resourceType, filterPlayable }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Cloudinary configuration is missing" ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
