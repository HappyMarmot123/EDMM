import fs from "node:fs";
import path from "node:path";

describe("run-lighthouse-local script", () => {
  it("exists as the stable local Lighthouse runner", () => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "run-lighthouse-local.mjs",
    );

    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("keeps the measured route and run-count contract", () => {
    const script = fs.readFileSync(
      path.join(process.cwd(), "scripts", "run-lighthouse-local.mjs"),
      "utf8",
    );

    expect(script).toContain('"/"');
    expect(script).toContain('"/search?view=all"');
    expect(script).toContain('"/search?view=recent"');
    expect(script).toContain("LIGHTHOUSE_RUNS ?? 3");
    expect(script).toContain("manifest.json");
  });
});
