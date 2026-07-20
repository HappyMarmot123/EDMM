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
    expect(source).not.toContain("@/features/lyrics/");
  });

  it("loads the mobile fullscreen player through next/dynamic instead of a static import", () => {
    const source = readSource("src/features/audio/ui/mobileAudioPlayer.tsx");

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("dynamic<MobileFullscreenPlayerProps>");
    expect(source).not.toMatch(
      /^import\s+MobileFullscreenPlayer\s+from\s+["']@\/features\/audio\/components\/mobile\/mobileFullscreenPlayer["'];/m,
    );
    expect(source).not.toContain("@/features/lyrics/");
  });

  it("keeps the lyrics experience inside the lazy fullscreen chunks", () => {
    const desktopSource = readSource(
      "src/features/audio/components/desktopFullscreenPlayer.tsx",
    );
    const mobileSource = readSource(
      "src/features/audio/components/mobile/mobileFullscreenPlayer.tsx",
    );

    expect(desktopSource).toContain(
      "@/features/lyrics/components/fullscreenLyricsExperience",
    );
    expect(mobileSource).toContain(
      "@/features/lyrics/components/fullscreenLyricsExperience",
    );
  });
});
