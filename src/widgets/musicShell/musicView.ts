export const MUSIC_VIEWS = ["pop", "edm", "recent"] as const;

export type MusicView = (typeof MUSIC_VIEWS)[number];

type RouteValue = string | string[] | undefined;

export const pickFirstValue = (value: RouteValue): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const isMusicView = (
  value: unknown,
): value is MusicView => {
  return value === "pop" || value === "edm" || value === "recent";
};

export const parseMusicView = (value: RouteValue): MusicView | undefined => {
  const candidate = pickFirstValue(value);
  return isMusicView(candidate) ? candidate : undefined;
};

export const normalizeMusicView = (
  value: RouteValue | MusicView | null | undefined,
): MusicView => (isMusicView(value) ? value : "pop");
