import fs from "fs";
import path from "path";

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

describe("Tooltip styles", () => {
  it("uses the EDMM player surface instead of the old gradient treatment", () => {
    const contentRule = extractRule(".radix-tooltip-content-edmm");
    const arrowRule = extractRule(".radix-tooltip-arrow-edmm");

    expect(contentRule).toContain("background: rgba(43, 17, 28, 0.98);");
    expect(contentRule).toContain("border: 1px solid rgba(255, 152, 162, 0.55);");
    expect(contentRule).toContain("outline: 1px solid rgba(255, 255, 255, 0.08);");
    expect(contentRule).toContain("backdrop-filter: blur(16px);");
    expect(contentRule).not.toMatch(/linear-gradient|radix-tooltip-content-gradient/);
    expect(arrowRule).toContain("fill: rgba(43, 17, 28, 0.98);");
  });
});
