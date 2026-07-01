import fs from "fs";
import path from "path";

const heroSource = fs.readFileSync(
  path.join(process.cwd(), "src/features/landing/ui/landingHero.tsx"),
  "utf8",
);

describe("LandingHero dynamic loading", () => {
  it("loads the Cobe orbit through next/dynamic without SSR", () => {
    expect(heroSource).toContain('from "next/dynamic"');
    expect(heroSource).toContain('import("./landingCobeOrbit")');
    expect(heroSource).toContain("ssr: false");
  });
});
