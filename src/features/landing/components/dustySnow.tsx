"use client";

import { useEffect, useMemo, useState } from "react";

interface DustySnowProps {
  reducedMotion?: boolean;
  count?: number;
}

const createStars = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}vw`,
    opacity: Math.random() * 0.42 + 0.28,
    scale: Math.random() * 0.72 + 0.28,
    duration: `${Math.random() * 14 + 16}s`,
    delay: `${Math.random() * -24}s`,
  }));

export default function DustySnow({
  reducedMotion = false,
  count = 150,
}: DustySnowProps) {
  const [isClient, setIsClient] = useState(false);
  const stars = useMemo(
    () => createStars(reducedMotion ? Math.min(count, 54) : count),
    [count, reducedMotion]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div
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
