import fs from "fs";
import path from "path";

const providerSource = fs.readFileSync(
  path.join(process.cwd(), "src/shared/providers/audioPlayerProvider.tsx"),
  "utf8",
);

describe("AudioPlayerProvider source ownership", () => {
  it("assigns audio.src only from the playback synchronization effect", () => {
    const directSrcAssignments = providerSource.match(/\baudio\.src\s*=/g) ?? [];

    expect(directSrcAssignments).toHaveLength(1);
    expect(providerSource).toContain("const trackUrl = currentTrack?.streamUrl");
  });
});
