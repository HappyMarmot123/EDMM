import type { Track } from "@/entities/Track/model";

type CloudinaryContext = {
  custom?: Record<string, string | undefined>;
  [key: string]: unknown;
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
  return segments.length > 1 ? segments[segments.length - 2] : "";
};

const readString = (
  source: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const asRecord = (value: unknown) =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;

const readStringFromRecords = (
  records: Array<Record<string, unknown> | undefined>,
  keys: string[],
) => {
  for (const key of keys) {
    for (const record of records) {
      const value = readString(record, key);
      if (value) {
        return value;
      }
    }
  }

  return undefined;
};

export function adaptCloudinaryTrack(resource: CloudinaryResource): Track {
  const custom = resource.context?.custom;
  const metadata = resource.metadata as Record<string, unknown> | undefined;
  const resourceType = resource.resource_type ?? "video";
  const assetId = resource.asset_id || resource.public_id;
  const context = resource.context as Record<string, unknown> | undefined;
  const metadataContext = asRecord(metadata?.context);
  const contextCustom = asRecord(context?.custom);

  const title =
    readStringFromRecords(
    [custom, context, contextCustom, metadataContext, metadata],
    ["caption"],
  ) ??
    basename(resource.public_id);
  const artistName =
    readStringFromRecords(
      [custom, context, contextCustom, metadataContext, metadata],
      ["artist", "dj", "creator", "author", "alt"],
    ) ??
    "";
  const artistId = artistName ? `cloudinary:${artistName}` : "";
  const albumName =
    readStringFromRecords(
      [custom, context, contextCustom, metadataContext, metadata],
      [
        "album",
        "album_name",
        "albumName",
        "project",
        "collection",
        "release",
      ],
    ) ??
    folderName(resource.public_id);
  const artworkFromSource =
    readStringFromRecords(
      [
        custom,
        context,
        contextCustom,
        metadataContext,
        metadata,
      ],
      [
        "artworkUrl",
        "artwork_url",
        "artwork",
        "cover",
        "coverArt",
        "cover_art",
        "cover_url",
        "coverUrl",
        "image",
        "imageUrl",
      ],
    ) ??
    (resourceType === "image" ? resource.secure_url ?? "" : "");
  const artworkUrl =
    artworkFromSource ?? "";

  return {
    id: `cloudinary:${assetId}`,
    source: "cloudinary",
    title,
    artistId,
    artistName,
    albumName,
    artworkUrl,
    durationMs: Math.round((resource.duration ?? 0) * 1000),
    streamUrl: resource.secure_url ?? "",
    metadata: {
      publicId: resource.public_id,
      assetId: resource.asset_id,
      format: resource.format,
      resourceType,
      type: resource.type,
      bytes: resource.bytes,
      createdAt: resource.created_at,
      tags: resource.tags ?? [],
      context: resource.context,
      cloudinaryMetadata: resource.metadata,
    },
  };
}
