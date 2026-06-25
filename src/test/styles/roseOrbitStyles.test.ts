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
});
