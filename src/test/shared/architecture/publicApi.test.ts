import fs from "fs";
import path from "path";

const sourceRoot = path.join(process.cwd(), "src");

type PublicApiRule = {
  ownerPrefix: string;
  forbiddenImports: string[];
};

const publicApiRules: PublicApiRule[] = [
  {
    ownerPrefix: "entities/track/",
    forbiddenImports: ["@/entities/track/model"],
  },
  {
    ownerPrefix: "features/audio/",
    forbiddenImports: [
      "@/features/audio/components/",
      "@/features/audio/hooks/",
      "@/features/audio/ui/",
    ],
  },
  {
    ownerPrefix: "features/library/",
    forbiddenImports: ["@/features/library/hooks/"],
  },
  {
    ownerPrefix: "shared/db/",
    forbiddenImports: [
      "@/shared/db/edmmDB",
      "@/shared/db/repositories/",
    ],
  },
];

const collectSourceFiles = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
};

const toSourceRelativePath = (filePath: string) =>
  path.relative(sourceRoot, filePath).replaceAll("\\", "/");

const isProductionSource = (relativePath: string) => {
  return (
    !relativePath.startsWith("test/") &&
    !relativePath.includes("/__tests__/") &&
    !relativePath.includes(".test.")
  );
};

describe("slice public API boundaries", () => {
  it("routes production imports through the selected slice barrels", () => {
    const violations = collectSourceFiles(sourceRoot)
      .map((filePath) => ({
        relativePath: toSourceRelativePath(filePath),
        source: fs.readFileSync(filePath, "utf8"),
      }))
      .filter(({ relativePath }) => isProductionSource(relativePath))
      .flatMap(({ relativePath, source }) =>
        publicApiRules.flatMap((rule) => {
          if (relativePath.startsWith(rule.ownerPrefix)) {
            return [];
          }

          return rule.forbiddenImports
            .filter((importPath) => source.includes(importPath))
            .map((importPath) => `${relativePath} -> ${importPath}`);
        }),
      );

    expect(violations).toEqual([]);
  });
});
