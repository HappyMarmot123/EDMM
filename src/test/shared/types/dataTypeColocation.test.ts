import fs from "fs";
import path from "path";

const sourceRoot = path.join(process.cwd(), "src");

const collectSourceFiles = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
};

describe("shared type colocation", () => {
  it("keeps component, provider, and HTTP types out of shared/types/dataType", () => {
    const dataTypePath = path.join(sourceRoot, "shared", "types", "dataType.ts");
    const deprecatedImport = ["@/shared/types", "dataType"].join("/");
    const sourceFiles = collectSourceFiles(sourceRoot);
    const dataTypeImports = sourceFiles.filter((filePath) =>
      fs
        .readFileSync(filePath, "utf8")
        .includes(deprecatedImport),
    );

    expect(fs.existsSync(dataTypePath)).toBe(false);
    expect(dataTypeImports).toEqual([]);
  });
});
