"use client";

import { useMemo } from "react";

interface DustySnowProps {
  reducedMotion?: boolean;
  count?: number;
}

const depthProfiles = [
  {
    depth: "far",
    size: [1.2, 2.4],
    opacity: [0.16, 0.34],
    blur: [0.6, 1.4],
    drift: [8, 18],
    duration: [28, 44],
    trail: [8, 18],
  },
  {
    depth: "mid",
    size: [2.1, 4.2],
    opacity: [0.26, 0.52],
    blur: [0.2, 0.8],
    drift: [14, 30],
    duration: [22, 36],
    trail: [14, 32],
  },
  {
    depth: "near",
    size: [3.4, 6.8],
    opacity: [0.42, 0.78],
    blur: [0, 0.35],
    drift: [22, 46],
    duration: [16, 28],
    trail: [24, 58],
  },
] as const;

const pseudoRandom = (seed: number) => {
  let value = seed >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = value ^ (value >>> 16);

  return (value >>> 0) / 4294967296;
};

const between = (seed: number, min: number, max: number) =>
  min + pseudoRandom(seed) * (max - min);

const toFixed = (value: number, precision = 4) => value.toFixed(precision);

const createStars = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const seed = index + 1;
    const profile = depthProfiles[index % depthProfiles.length];
    const direction = index % 4 === 0 || index % 4 === 3 ? -1 : 1;
    const drift = between(seed + 503, profile.drift[0], profile.drift[1]);
    const sway = between(seed + 607, 4, 18) * (direction * -1);

    return {
      id: index,
      depth: profile.depth,
      left: `${(pseudoRandom(seed) * 100).toFixed(4)}vw`,
      startY: `${toFixed(-between(seed + 701, 2, 18), 3)}vh`,
      size: `${toFixed(
        between(seed + 101, profile.size[0], profile.size[1]),
        3
      )}px`,
      opacity: Number(
        toFixed(between(seed + 211, profile.opacity[0], profile.opacity[1]))
      ),
      scale: Number(toFixed(between(seed + 307, 0.78, 1.18))),
      blur: `${toFixed(
        between(seed + 409, profile.blur[0], profile.blur[1]),
        3
      )}px`,
      driftX: `${toFixed(direction * drift, 3)}vw`,
      swayX: `${toFixed(sway, 3)}vw`,
      fallDistance: `${toFixed(between(seed + 809, 108, 128), 3)}vh`,
      duration: `${toFixed(
        between(seed + 907, profile.duration[0], profile.duration[1]),
        3
      )}s`,
      delay: `${toFixed(-between(seed + 1009, 0, profile.duration[1]), 3)}s`,
      trailLength: `${toFixed(
        between(seed + 1103, profile.trail[0], profile.trail[1]),
        3
      )}px`,
      trailOpacity: Number(toFixed(between(seed + 1201, 0.16, 0.42))),
      trailAngle: direction < 0 ? "28deg" : "152deg",
      twinkleDuration: `${toFixed(between(seed + 1301, 2.4, 5.8), 3)}s`,
      glowSize: `${toFixed(between(seed + 1409, 12, 30), 3)}px`,
    };
  });

export default function DustySnow({
  reducedMotion = false,
  count = 150,
}: DustySnowProps) {
  const starCount = reducedMotion ? Math.min(count, 54) : count;
  const stars = useMemo(() => createStars(starCount), [starCount]);

  return (
    <div
      aria-hidden="true"
      className={`rose-starfield${reducedMotion ? " rose-starfield--reduced" : ""}`}
      data-testid="rose-starfield"
    >
      {stars.map((star) => {
        const style = {
          "--left-pos": star.left,
          "--start-y": star.startY,
          "--size": star.size,
          "--opacity": star.opacity,
          "--scale": star.scale,
          "--blur": star.blur,
          "--drift-x": star.driftX,
          "--sway-x": star.swayX,
          "--fall-distance": star.fallDistance,
          "--duration": star.duration,
          "--delay": star.delay,
          "--trail-length": star.trailLength,
          "--trail-opacity": star.trailOpacity,
          "--trail-angle": star.trailAngle,
          "--twinkle-duration": star.twinkleDuration,
          "--glow-size": star.glowSize,
        } as React.CSSProperties;

        return (
          <span
            className={`rose-star rose-star--${star.depth}`}
            data-depth={star.depth}
            key={star.id}
            style={style}
          />
        );
      })}
    </div>
  );
}
