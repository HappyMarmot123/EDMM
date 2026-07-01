const OPTIMIZED_ARTWORK_HOSTS = new Set([
  "res.cloudinary.com",
  "singhimalaya.github.io",
  "upload.wikimedia.org",
]);

export const shouldUnoptimizeArtworkImage = (src: string) => {
  if (!src) {
    return false;
  }

  if (src.startsWith("/")) {
    return false;
  }

  try {
    const url = new URL(src);

    if (url.protocol !== "https:") {
      return true;
    }

    return !OPTIMIZED_ARTWORK_HOSTS.has(url.hostname);
  } catch {
    return true;
  }
};
