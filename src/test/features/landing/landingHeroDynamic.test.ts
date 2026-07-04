import fs from "fs";
import path from "path";

const heroSource = fs.readFileSync(
  path.join(process.cwd(), "src/features/landing/ui/landingHero.tsx"),
  "utf8",
);

const deferredOrbitSource = fs.readFileSync(
  path.join(process.cwd(), "src/features/landing/ui/deferredCobeOrbit.tsx"),
  "utf8",
);

describe("LandingHero dynamic loading", () => {
  it("keeps the hero server-safe while deferring Cobe through next/dynamic", () => {
    expect(heroSource).not.toContain('from "next/dynamic"');
    expect(heroSource).not.toContain("landingStartLink");
    expect(heroSource).toContain("<DeferredCobeOrbit />");
    expect(deferredOrbitSource).toContain('from "next/dynamic"');
    expect(deferredOrbitSource).toContain('import("./landingCobeOrbit")');
    expect(deferredOrbitSource).toContain("ssr: false");
  });
});
