export const CLOUDINARY_TRACK_CATEGORIES = ["pop", "edm"] as const;

export type CloudinaryTrackCategory = (typeof CLOUDINARY_TRACK_CATEGORIES)[number];

export const parseCloudinaryCategory = (
  value: string | null | undefined,
): CloudinaryTrackCategory | undefined => {
  const normalized = value?.trim().toLowerCase() ?? "";

  return (CLOUDINARY_TRACK_CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as CloudinaryTrackCategory)
    : undefined;
};
