import fs from "fs";
import path from "path";

const elementSyncSource = fs.readFileSync(
  path.join(process.cwd(), "src/shared/providers/useAudioElementSync.ts"),
  "utf8",
);

describe("AudioPlayerProvider source ownership", () => {
  // AE8 이후 재생 소스 전환은 오디오 엔진 API(transitionAudioTrack)가 소유한다.
  // sync 훅이 audio.src를 직접 할당하기 시작하면 소유권이 다시 분산되므로 가드한다.
  it("routes source transitions through the audio engine instead of assigning audio.src", () => {
    const directSrcAssignments =
      elementSyncSource.match(/\baudio\.src\s*=/g) ?? [];

    expect(directSrcAssignments).toHaveLength(0);
    expect(elementSyncSource).toContain("transitionAudioTrack(");
    expect(elementSyncSource).toContain("const trackUrl = currentTrack?.streamUrl");
  });
});
