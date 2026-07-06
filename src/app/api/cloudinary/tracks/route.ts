import { NextResponse } from "next/server";
import {
  buildCloudinaryCacheHeader,
  fetchCloudinaryTracks,
  getCloudinaryTrackCachePolicy,
  normalizeCloudinaryCacheVersion,
  type ResourceTypeFilter,
} from "@/shared/api/cloudinary/cloudinaryClient";
import {
  parseCloudinaryCategory,
  type CloudinaryTrackCategory,
} from "@/shared/api/cloudinary/cloudinaryCategory";

const parseResourceType = (value: string | null): ResourceTypeFilter => {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "video" ||
    normalized === "image" ||
    normalized === "all"
  ) {
    return normalized;
  }

  return "all";
};

const parseFilterPlayable = (value: string | null) => {
  if (value === null) return undefined;
  return value === "true";
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q") ?? "";
  const resourceType = parseResourceType(requestUrl.searchParams.get("resourceType"));
  const filterPlayable = parseFilterPlayable(
    requestUrl.searchParams.get("filterPlayable"),
  );
  const category = parseCloudinaryCategory(
    requestUrl.searchParams.get("category"),
  );
  const cacheVersion = normalizeCloudinaryCacheVersion(
    requestUrl.searchParams.get("v"),
  );
  const cachePolicy = getCloudinaryTrackCachePolicy(resourceType);
  const fetchOptions: {
    resourceType: ResourceTypeFilter;
    filterPlayable?: boolean;
    category?: CloudinaryTrackCategory;
    cacheVersion?: string;
  } = {
    resourceType,
  };

  try {
    if (filterPlayable !== undefined) {
      fetchOptions.filterPlayable = filterPlayable;
    }

    if (category) {
      fetchOptions.category = category;
    }

    if (cacheVersion) {
      fetchOptions.cacheVersion = cacheVersion;
    }

    const tracks = await fetchCloudinaryTracks(query, {
      ...fetchOptions,
    });

    return NextResponse.json(
      tracks,
      {
        headers: {
          "Cache-Control": buildCloudinaryCacheHeader(cachePolicy),
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Cloudinary configuration is missing" ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
