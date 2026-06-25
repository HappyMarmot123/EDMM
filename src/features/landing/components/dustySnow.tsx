"use client";

import { useMemo } from "react";

interface DustySnowProps {
  reducedMotion?: boolean;
  count?: number;
}

const pseudoRandom = (seed: number) => {
  let value = seed >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = value ^ (value >>> 16);

  return (value >>> 0) / 4294967296;
};

const createStars = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const seed = index + 1;

    return {
      id: index,
      left: `${(pseudoRandom(seed) * 100).toFixed(4)}vw`,
      opacity: Number((pseudoRandom(seed + 101) * 0.42 + 0.28).toFixed(4)),
      scale: Number((pseudoRandom(seed + 211) * 0.72 + 0.28).toFixed(4)),
      duration: `${(pseudoRandom(seed + 307) * 14 + 16).toFixed(4)}s`,
      delay: `${(pseudoRandom(seed + 409) * -24).toFixed(4)}s`,
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
          "--opacity": star.opacity,
          "--scale": star.scale,
          "--duration": star.duration,
          "--delay": star.delay,
        } as React.CSSProperties;

        return <span className="rose-star" key={star.id} style={style} />;
      })}
    </div>
  );
}
