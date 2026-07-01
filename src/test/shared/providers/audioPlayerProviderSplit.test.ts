import fs from "fs";
import path from "path";

const providerSource = fs.readFileSync(
  path.join(process.cwd(), "src/shared/providers/audioPlayerProvider.tsx"),
  "utf8",
);

describe("AudioPlayerProvider split ownership", () => {
  it("delegates artwork recovery and audio element effects to provider hooks", () => {
    expect(providerSource).toContain('from "./useAudioArtworkRecovery"');
    expect(providerSource).toContain('from "./useAudioElementSync"');
    expect(providerSource).not.toContain("resolveArtworkUrlWithCache");
    expect(providerSource).not.toContain("setupAudioEventListeners");
  });
});
