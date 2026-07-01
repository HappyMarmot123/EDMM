import fs from "fs";
import path from "path";

const eslintConfigSource = fs.readFileSync(
  path.join(process.cwd(), "eslint.config.mjs"),
  "utf8",
);

describe("ESLint safety rules", () => {
  it("keeps zero-violation safety rules enabled", () => {
    expect(eslintConfigSource).toContain(
      '"@typescript-eslint/no-explicit-any": "error"',
    );
    expect(eslintConfigSource).toContain('"prefer-const": "error"');
    expect(eslintConfigSource).toContain('"no-console": "error"');
    expect(eslintConfigSource).toContain('files: ["src/shared/lib/logger.ts"]');
    expect(eslintConfigSource).toContain('"no-console": "off"');
  });
});
