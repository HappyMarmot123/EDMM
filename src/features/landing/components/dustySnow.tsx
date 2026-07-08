import type { CSSProperties } from "react";

type StarStyle = CSSProperties & Record<`--${string}`, string | number>;

type DustySnowProps = {
  count?: number;
  reducedMotion?: boolean;
};

const DEFAULT_STAR_COUNT = 42;
const REDUCED_MOTION_STAR_CAP = 54;
const DEPTH_CLASSES = ["far", "mid", "near"] as const;
const STARFIELD_CLASS_NAMES = {
  default: "rose-starfield",
  reduced: "rose-starfield rose-starfield--reduced",
} as const;

function createStarStyle(index: number): StarStyle {
  const left = (index * 37) % 100;
  const top = (index * 53) % 100;
  const startY = -8 - ((index * 29) % 28);
  const duration = 14 + ((index * 7) % 18);
  const twinkleDuration = 2.4 + ((index * 5) % 28) / 10;
  const delay = -(((index * 997) % 12000) / 1000);
  const drift = (index % 2 === 0 ? 1 : -1) * (12 + ((index * 5) % 30));
  const sway = (index % 2 === 0 ? -1 : 1) * (8 + ((index * 9) % 24));
  const fallDistance = 108 + ((index * 11) % 28);
  const scale = 0.45 + ((index * 17) % 55) / 100;
  const opacity = 0.18 + ((index * 13) % 42) / 100;
  const size = 2 + ((index * 7) % 11) * 0.28;
  const glowSize = 9 + ((index * 13) % 22);
  const blur = ((index * 3) % 4) / 10;

  return {
    "--x": `${left}%`,
    "--y": `${top}%`,
    "--start-y": `${startY}vh`,
    "--left": `${left}%`,
    "--top": `${top}%`,
    "--left-pos": `${left}%`,
    "--duration": `${duration}s`,
    "--twinkle-duration": `${twinkleDuration.toFixed(1)}s`,
    "--delay": `${delay}s`,
    "--drift": `${drift}px`,
    "--drift-x": `${drift}px`,
    "--sway-x": `${sway}px`,
    "--fall-distance": `${fallDistance}vh`,
    "--scale": scale.toFixed(2),
    "--opacity": opacity.toFixed(2),
    "--size": `${size.toFixed(2)}px`,
    "--star-size": `${size.toFixed(2)}px`,
    "--glow-size": `${glowSize}px`,
    "--blur": `${blur.toFixed(1)}px`,
  };
}

function getStarClassName(index: number) {
  return `rose-star rose-star--${DEPTH_CLASSES[index % DEPTH_CLASSES.length]}`;
}

export function DustySnow({
  count = DEFAULT_STAR_COUNT,
  reducedMotion = false,
}: DustySnowProps) {
  const starCount = reducedMotion
    ? Math.min(count, REDUCED_MOTION_STAR_CAP)
    : count;
  const starfieldClassName = reducedMotion
    ? STARFIELD_CLASS_NAMES.reduced
    : STARFIELD_CLASS_NAMES.default;

  return (
    <div
      className={starfieldClassName}
      data-testid="rose-starfield"
      aria-hidden="true"
    >
      {Array.from({ length: starCount }, (_, index) => (
        <span
          key={index}
          className={getStarClassName(index)}
          data-depth={(index % 3) + 1}
          style={createStarStyle(index)}
        />
      ))}
    </div>
  );
}

export default DustySnow;
