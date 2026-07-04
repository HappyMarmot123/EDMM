import type { CSSProperties } from "react";

type StarStyle = CSSProperties & Record<`--${string}`, string | number>;

type DustySnowProps = {
  count?: number;
  reducedMotion?: boolean;
};

const DEFAULT_STAR_COUNT = 42;
const REDUCED_MOTION_STAR_CAP = 54;

function createStarStyle(index: number): StarStyle {
  const left = (index * 37) % 100;
  const top = (index * 53) % 100;
  const duration = 14 + ((index * 7) % 18);
  const delay = -(((index * 997) % 12000) / 1000);
  const drift = (index % 2 === 0 ? 1 : -1) * (12 + ((index * 5) % 30));
  const scale = 0.45 + ((index * 17) % 55) / 100;
  const opacity = 0.18 + ((index * 13) % 42) / 100;
  const size = 1 + (((index * 7) % 11) * 0.22);

  return {
    "--x": `${left}%`,
    "--y": `${top}%`,
    "--left": `${left}%`,
    "--top": `${top}%`,
    "--left-pos": `${left}%`,
    "--duration": `${duration}s`,
    "--delay": `${delay}s`,
    "--drift": `${drift}px`,
    "--drift-x": `${drift}px`,
    "--scale": scale.toFixed(2),
    "--opacity": opacity.toFixed(2),
    "--size": `${size.toFixed(2)}px`,
    "--star-size": `${size.toFixed(2)}px`,
  };
}

export function DustySnow({
  count = DEFAULT_STAR_COUNT,
  reducedMotion = false,
}: DustySnowProps) {
  const starCount = reducedMotion
    ? Math.min(count, REDUCED_MOTION_STAR_CAP)
    : count;

  return (
    <div
      className={`rose-starfield${reducedMotion ? " rose-starfield--reduced" : ""}`}
      data-testid="rose-starfield"
      aria-hidden="true"
    >
      {Array.from({ length: starCount }, (_, index) => (
        <span
          key={index}
          className="rose-star"
          data-depth={(index % 3) + 1}
          style={createStarStyle(index)}
        />
      ))}
    </div>
  );
}

export default DustySnow;