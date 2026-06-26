import fs from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import DustySnow from "@/features/landing/components/dustySnow";
import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";

const styles = fs.readFileSync(
  path.join(process.cwd(), "src/shared/styles/global.css"),
  "utf8"
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

const originalMatchMedia = window.matchMedia;

describe("RoseSpaceBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders an aria-hidden rose space background", async () => {
    render(<RoseSpaceBackground />);

    const background = screen.getByTestId("rose-space-background");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveClass("rose-space-background");

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toBeInTheDocument();
    });
  });

  it("marks the background as reduced when prefers-reduced-motion is active", async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<RoseSpaceBackground />);

    expect(screen.getByTestId("rose-space-background")).toHaveAttribute(
      "data-reduced-motion",
      "true"
    );

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toHaveClass(
        "rose-starfield--reduced"
      );
    });
  });

  it("uses legacy media query listeners when event listeners are unavailable", () => {
    const addListener = jest.fn();
    const removeListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener,
      removeListener,
      dispatchEvent: jest.fn(),
    }));

    const { unmount } = render(<RoseSpaceBackground />);

    expect(addListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});

describe("DustySnow", () => {
  it("renders an inert aria-hidden starfield when mounted directly", async () => {
    render(<DustySnow />);

    const starfield = await screen.findByTestId("rose-starfield");
    expect(starfield).toHaveAttribute("aria-hidden", "true");
    expect(starfield).toHaveClass("rose-starfield");
  });

  it("renders 96 stars by default", async () => {
    render(<DustySnow />);

    const starfield = await screen.findByTestId("rose-starfield");
    expect(starfield.querySelectorAll(".rose-star")).toHaveLength(96);
  });

  it("keeps the starfield right aligned at 80 percent width", () => {
    const starfieldRule = extractRule(".rose-starfield");

    expect(starfieldRule).toContain("inset-block: 0;");
    expect(starfieldRule).toContain("right: 0;");
    expect(starfieldRule).toContain("left: auto;");
    expect(starfieldRule).toContain("width: 80%;");
    expect(starfieldRule).not.toContain("inset: 0;");
  });

  it("caps reduced-motion stars at 54", async () => {
    render(<DustySnow reducedMotion count={150} />);

    const starfield = await screen.findByTestId("rose-starfield");
    await waitFor(() => {
      expect(starfield.querySelectorAll(".rose-star")).toHaveLength(54);
    });
  });

  it("keeps reduced-motion stars below the cap when count is lower", async () => {
    render(<DustySnow reducedMotion count={12} />);

    const starfield = await screen.findByTestId("rose-starfield");
    await waitFor(() => {
      expect(starfield.querySelectorAll(".rose-star")).toHaveLength(12);
    });
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

  it("uses starfield-relative percent left positions", async () => {
    render(<DustySnow count={8} />);

    const starfield = await screen.findByTestId("rose-starfield");
    const leftPositions = Array.from(
      starfield.querySelectorAll<HTMLElement>(".rose-star")
    ).map((star) => star.style.getPropertyValue("--left-pos"));

    expect(leftPositions).toHaveLength(8);
    expect(leftPositions.every((value) => value.endsWith("%"))).toBe(true);
    expect(leftPositions.some((value) => value.endsWith("vw"))).toBe(false);
  });

  it("varies star size, depth, and movement direction naturally", async () => {
    render(<DustySnow count={18} />);

    const starfield = await screen.findByTestId("rose-starfield");
    const stars = Array.from(
      starfield.querySelectorAll<HTMLElement>(".rose-star")
    );

    const styleValues = (property: string) =>
      stars.map((star) => star.style.getPropertyValue(property));
    const driftValues = styleValues("--drift-x").map((value) =>
      Number.parseFloat(value)
    );

    expect(new Set(styleValues("--size")).size).toBeGreaterThan(6);
    expect(new Set(stars.map((star) => star.dataset.depth)).size).toBe(3);
    expect(styleValues("--trail-length").every(Boolean)).toBe(false);
    expect(driftValues.some((value) => value < 0)).toBe(true);
    expect(driftValues.some((value) => value > 0)).toBe(true);
  });
});
