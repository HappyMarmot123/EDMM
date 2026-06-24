import { db } from "../../edmmDB";
import { addRecentPlay, getRecentPlays } from "../recentPlaysRepo";

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe("recentPlaysRepo", () => {
  it("returns recent plays newest first and dedupes repeated tracks", async () => {
    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(300);

    await addRecentPlay("a");
    await addRecentPlay("b");
    await addRecentPlay("a");

    expect((await getRecentPlays()).map((play) => play.trackId)).toEqual(["a", "b"]);
  });

  it("keeps only the latest 50 recent plays", async () => {
    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    for (let i = 0; i < 55; i += 1) {
      now = i;
      await addRecentPlay(`track-${i}`);
    }

    const recentPlays = await getRecentPlays();

    expect(recentPlays).toHaveLength(50);
    expect(recentPlays.map((play) => play.trackId)).toEqual(
      Array.from({ length: 50 }, (_, index) => `track-${54 - index}`)
    );
  });
});
