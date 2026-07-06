import type { CSSProperties, ReactNode } from "react";

type ParallaxProps = {
  children: ReactNode;
  baseVelocity?: number;
  repeat?: number;
};

type ParallaxStyle = CSSProperties & Record<`--${string}`, string | number>;

const DEFAULT_REPEAT_COUNT = 8;
const MIN_DURATION_SECONDS = 22;
const DISTANCE_FACTOR = 72;

function getDuration(baseVelocity: number) {
  const speed = Math.max(Math.abs(baseVelocity), 0.25);

  return `${Math.max(MIN_DURATION_SECONDS, DISTANCE_FACTOR / speed)}s`;
}

export function Parallax({
  children,
  baseVelocity = 1,
  repeat = DEFAULT_REPEAT_COUNT,
}: ParallaxProps) {
  const direction = baseVelocity < 0 ? "reverse" : "forward";
  const style: ParallaxStyle = {
    "--marquee-duration": getDuration(baseVelocity),
  };

  return (
    <div
      className="parallax"
      data-direction={direction}
      data-testid="rose-css-marquee"
      style={style}
    >
      <div className="scroller" aria-hidden="true">
        {Array.from({ length: repeat }, (_, index) => (
          <span key={index}>{children}</span>
        ))}
      </div>
    </div>
  );
}
export default Parallax;
