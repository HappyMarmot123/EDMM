export const decodeTrackId = (trackId: string): string | null => {
  try {
    const decoded = decodeURIComponent(trackId);
    return decoded.trim().length > 0 ? decoded : null;
  } catch {
    return null;
  }
};
