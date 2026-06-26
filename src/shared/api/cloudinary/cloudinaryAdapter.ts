import type { Track } from "@/entities/track/model";

type CloudinaryContext = {
  custom?: Record<string, string | undefined>;
};

export interface CloudinaryResource {
  asset_id?: string;
  public_id: string;
  resource_type?: string;
  type?: string;
  format?: string;
  secure_url?: string;
  bytes?: number;
  duration?: number;
  created_at?: string;
  tags?: string[];
  context?: CloudinaryContext;
  metadata?: Record<string, unknown>;
}

const basename = (publicId: string) => {
  const segments = publicId.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? publicId;
  return lastSegment.replace(/\.[a-z0-9]+$/i, "").trim();
};

const folderName = (publicId: string) => {
  const segments = publicId.split("/").filter(Boolean);
  return segments.length > 1 ? segments[segments.length - 2] : "Cloudinary";
};

const readString = (
  source: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export function adaptCloudinaryTrack(resource: CloudinaryResource): Track {
  const custom = resource.context?.custom;
  const metadata = resource.metadata;
  const assetId = resource.asset_id || resource.public_id;
  const title =
    readString(custom, "title") ??
    readString(metadata, "title") ??
    basename(resource.public_id);
  const artistName =
    readString(custom, "artist") ??
    readString(metadata, "artist") ??
    "Cloudinary";
  const albumName =
    readString(custom, "album") ??
    readString(metadata, "album") ??
    folderName(resource.public_id);
  const artworkUrl =
    readString(custom, "artworkUrl") ??
    readString(metadata, "artworkUrl") ??
    "";

  return {
    id: `cloudinary:${assetId}`,
    source: "cloudinary",
    title,
    artistId: `cloudinary:${artistName}`,
    artistName,
    albumName,
    artworkUrl,
    durationMs: Math.round((resource.duration ?? 0) * 1000),
    streamUrl: resource.secure_url ?? "",
    metadata: {
      publicId: resource.public_id,
      assetId: resource.asset_id,
      format: resource.format,
      resourceType: resource.resource_type,
      type: resource.type,
      bytes: resource.bytes,
      createdAt: resource.created_at,
      tags: resource.tags ?? [],
      context: resource.context,
      cloudinaryMetadata: resource.metadata,
    },
  };
}
