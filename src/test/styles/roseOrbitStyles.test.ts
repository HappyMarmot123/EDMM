import fs from "fs";
import path from "path";

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

const hasRule = (selector: string) => styles.includes(`${selector} {`);
const hasKeyframes = (name: string) => styles.includes(`@keyframes ${name} {`);

describe("Rose Orbit landing styles", () => {
  it("keeps hero title and primary CTA free of gradient fills", () => {
    const titleRule = extractRule(".rose-hero__title");
    const primaryCtaRule = extractRule(".rose-hero__cta--primary");

    expect(titleRule).not.toMatch(/gradient|background-clip/);
    expect(primaryCtaRule).not.toMatch(/gradient/);
  });

  it("uses the original my-gradient after layer instead of a space background gradient stack", () => {
    const backgroundRule = extractRule(".rose-space-background");
    const myGradientRule = extractRule(".my-gradient::after");

    expect(backgroundRule).toContain("background: var(--space-bg);");
    expect(backgroundRule).not.toMatch(/radial-gradient|linear-gradient/);
    expect(myGradientRule).toContain('content: ""');
    expect(myGradientRule).toContain("radial-gradient(var(--pink-main)");
    expect(myGradientRule).toContain("translateX(-50%) translateY(50vh)");
  });

  it("does not draw linear trail bars on rose stars", () => {
    expect(hasRule(".rose-star::after")).toBe(false);
  });

  it("removes the deprecated static hero orbit styles", () => {
    expect(hasRule(".rose-hero__orbit")).toBe(false);
    expect(hasRule(".rose-hero__orbit-tracer")).toBe(false);
    expect(hasRule(".rose-hero__orbit-marker")).toBe(false);
    expect(hasRule(".rose-hero__orbit-core")).toBe(false);
    expect(hasRule(".rose-hero__orbit-core-pulse")).toBe(false);
    expect(hasKeyframes("rose-orbit-spin")).toBe(false);
    expect(hasKeyframes("rose-orbit-marker")).toBe(false);
    expect(hasKeyframes("rose-core-breathe")).toBe(false);
    expect(hasKeyframes("rose-core-pulse")).toBe(false);
  });

  it("does not keep static orbit satellite styles", () => {
    expect(hasRule(".rose-hero__orbit-satellite")).toBe(false);
    expect(hasRule(".rose-hero__orbit-satellite--one")).toBe(false);
    expect(hasRule(".rose-hero__orbit-satellite--two")).toBe(false);
  });

  it("styles the Cobe hero replacement without retaining the deprecated orbit rules", () => {
    const cobeRule = extractRule(".rose-cobe-orbit");
    const canvasRule = extractRule(".rose-cobe-orbit__canvas");

    expect(cobeRule).toContain("aspect-ratio: 1");
    expect(cobeRule).toContain("pointer-events: none");
    expect(canvasRule).toContain("display: block");
    expect(canvasRule).not.toContain("cursor");
    expect(hasRule(".rose-hero__orbit")).toBe(false);
  });

  it("replaces followup link strips with a restrained footer", () => {
    const footerRule = extractRule(".rose-footer");

    expect(hasRule(".rose-followup__links")).toBe(false);
    expect(footerRule).toContain("border-top");
  });
});
