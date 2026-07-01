import fs from "fs";
import path from "path";

const elementSyncSource = fs.readFileSync(
  path.join(process.cwd(), "src/shared/providers/useAudioElementSync.ts"),
  "utf8",
);

describe("AudioPlayerProvider source ownership", () => {
  it("assigns audio.src only from the playback synchronization effect", () => {
    const directSrcAssignments =
      elementSyncSource.match(/\baudio\.src\s*=/g) ?? [];

    expect(directSrcAssignments).toHaveLength(1);
    expect(elementSyncSource).toContain("const trackUrl = currentTrack?.streamUrl");
  });
});
