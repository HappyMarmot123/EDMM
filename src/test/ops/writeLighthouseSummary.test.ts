import fs from "node:fs";
import path from "node:path";

describe("write-lighthouse-summary script", () => {
  it("exists as an executable Node script", () => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "write-lighthouse-summary.mjs",
    );

    expect(fs.existsSync(scriptPath)).toBe(true);
    expect(fs.readFileSync(scriptPath, "utf8")).toContain(
      "write-lighthouse-summary.mjs baseline|after",
    );
  });
});
