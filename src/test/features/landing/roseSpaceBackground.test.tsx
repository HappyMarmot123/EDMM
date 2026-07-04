import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import DustySnow from "@/features/landing/components/dustySnow";
import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";

const styles = fs.readFileSync(
  path.join(process.cwd(), "src/shared/styles/global.css"),
  "utf8",
);

const extractRule = (selector: string) => {
  const start = styles.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }

  const end = styles.indexOf("\n}", start);
  if (end === -1) {
    throw new Error(`Unclosed CSS rule for ${selector}`);
  }

  return styles.slice(start, end + 2);
};

describe("RoseSpaceBackground", () => {
  it("renders an aria-hidden rose space background without client motion state", () => {
    render(<RoseSpaceBackground />);

    const background = screen.getByTestId("rose-space-background");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveClass("rose-space-background");
    expect(background).not.toHaveAttribute("data-reduced-motion");
    expect(screen.getByTestId("rose-starfield")).toBeInTheDocument();
  });

  it("uses CSS media queries for reduced motion instead of JS listeners", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".rose-star");
  });
});

describe("DustySnow", () => {
  it("renders an inert aria-hidden starfield when mounted directly", () => {
    render(<DustySnow />);

    const starfield = screen.getByTestId("rose-starfield");
    expect(starfield).toHaveAttribute("aria-hidden", "true");
    expect(starfield).toHaveClass("rose-starfield");
  });

  it("renders 42 stars by default for a lighter initial landing render", () => {
    render(<DustySnow />);

    const starfield = screen.getByTestId("rose-starfield");
    expect(starfield.querySelectorAll(".rose-star")).toHaveLength(42);
  });

  it("provides the CSS variables required by the rose-star animations", () => {
    render(<DustySnow count={1} />);

    const star = screen
      .getByTestId("rose-starfield")
      .querySelector<HTMLElement>(".rose-star");

    expect(star).not.toBeNull();
    expect(star).toHaveClass("rose-star--far");
    expect(star?.style.getPropertyValue("--start-y")).toBeTruthy();
    expect(star?.style.getPropertyValue("--twinkle-duration")).toBeTruthy();
    expect(star?.style.getPropertyValue("--glow-size")).toBeTruthy();
    expect(star?.style.getPropertyValue("--blur")).toBeTruthy();
    expect(star?.style.getPropertyValue("--sway-x")).toBeTruthy();
    expect(star?.style.getPropertyValue("--fall-distance")).toBeTruthy();
  });

  it("keeps the starfield right aligned at 80 percent width", () => {
    const starfieldRule = extractRule(".rose-starfield");

    expect(starfieldRule).toContain("inset-block: 0;");
    expect(starfieldRule).toContain("right: 0;");
    expect(starfieldRule).toContain("left: auto;");
    expect(starfieldRule).toContain("width: 80%;");
    expect(starfieldRule).not.toContain("inset: 0;");
  });

  it("still supports an explicit reduced-motion cap when mounted directly", () => {
    render(<DustySnow reducedMotion count={150} />);

    const starfield = screen.getByTestId("rose-starfield");
    expect(starfield).toHaveClass("rose-starfield--reduced");
    expect(starfield.querySelectorAll(".rose-star")).toHaveLength(54);
  });

  it("keeps reduced-motion stars below the cap when count is lower", () => {
    render(<DustySnow reducedMotion count={12} />);

    const starfield = screen.getByTestId("rose-starfield");
    expect(starfield.querySelectorAll(".rose-star")).toHaveLength(12);
  });

  it("does not create random stars during server render", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    try {
      renderToString(<DustySnow />);
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("renders deterministic stars during server render", () => {
    const html = renderToString(<DustySnow count={3} />);

    expect(html.match(/class="rose-star\b/g)).toHaveLength(3);
  });

  it("uses starfield-relative percent left positions", () => {
    render(<DustySnow count={8} />);

    const starfield = screen.getByTestId("rose-starfield");
    const leftPositions = Array.from(
      starfield.querySelectorAll<HTMLElement>(".rose-star"),
    ).map((star) => star.style.getPropertyValue("--left-pos"));

    expect(leftPositions).toHaveLength(8);
    expect(leftPositions.every((value) => value.endsWith("%"))).toBe(true);
    expect(leftPositions.some((value) => value.endsWith("vw"))).toBe(false);
  });

  it("varies star size, depth, and movement direction naturally", () => {
    render(<DustySnow count={18} />);

    const starfield = screen.getByTestId("rose-starfield");
    const stars = Array.from(
      starfield.querySelectorAll<HTMLElement>(".rose-star"),
    );

    const styleValues = (property: string) =>
      stars.map((star) => star.style.getPropertyValue(property));
    const driftValues = styleValues("--drift-x").map((value) =>
      Number.parseFloat(value),
    );

    expect(new Set(styleValues("--size")).size).toBeGreaterThan(6);
    expect(new Set(stars.map((star) => star.dataset.depth)).size).toBe(3);
    expect(styleValues("--trail-length").every(Boolean)).toBe(false);
    expect(driftValues.some((value) => value < 0)).toBe(true);
    expect(driftValues.some((value) => value > 0)).toBe(true);
  });
});
