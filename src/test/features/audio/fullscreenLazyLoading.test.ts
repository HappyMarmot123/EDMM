import { readFileSync } from "fs";
import path from "path";

const rootDir = process.cwd();

const readSource = (relativePath: string) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");

describe("fullscreen player lazy loading boundaries", () => {
  it("loads the desktop fullscreen player through next/dynamic instead of a static import", () => {
    const source = readSource("src/features/audio/ui/audioPlayer.tsx");

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("dynamic<DesktopFullscreenPlayerProps>");
    expect(source).not.toMatch(
      /^import\s+DesktopFullscreenPlayer\s+from\s+["']@\/features\/audio\/components\/desktopFullscreenPlayer["'];/m,
    );
  });

  it("loads the mobile fullscreen player through next/dynamic instead of a static import", () => {
    const source = readSource("src/features/audio/ui/mobileAudioPlayer.tsx");

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("dynamic<MobileFullscreenPlayerProps>");
    expect(source).not.toMatch(
      /^import\s+MobileFullscreenPlayer\s+from\s+["']@\/features\/audio\/components\/mobile\/mobileFullscreenPlayer["'];/m,
    );
  });
});
