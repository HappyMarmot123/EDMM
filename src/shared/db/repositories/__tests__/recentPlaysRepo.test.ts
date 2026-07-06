import { db } from "../../edmmDB";
import {
  addRecentPlay,
  getRecentPlays,
  getRecentPlaysResult,
} from "../recentPlaysRepo";

const mockCaptureIndexedDbUnavailableEvent = jest.fn();
jest.mock("@/shared/lib/sentry/indexedDbEvents", () => ({
  captureIndexedDbUnavailableEvent: (...args: unknown[]) =>
    mockCaptureIndexedDbUnavailableEvent(...args),
  INDEXEDDB_OPERATIONS: {
    recentPlaysWrite: "recent_plays_write",
  },
}));

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe("recentPlaysRepo", () => {
  beforeEach(() => {
    mockCaptureIndexedDbUnavailableEvent.mockClear();
  });

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

  it("keeps only the latest 10 recent plays", async () => {
    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    for (let i = 0; i < 55; i += 1) {
      now = i;
      await addRecentPlay(`track-${i}`);
    }

    const recentPlays = await getRecentPlays();

    expect(recentPlays).toHaveLength(10);
    expect(recentPlays.map((play) => play.trackId)).toEqual(
      Array.from({ length: 10 }, (_, index) => `track-${54 - index}`)
    );
  });

  it("returns an empty list when reading recent plays fails", async () => {
    jest
      .spyOn(db.recentPlays, "orderBy")
      .mockImplementationOnce(() => {
        throw new Error("IndexedDB unavailable");
      });

    await expect(getRecentPlays()).resolves.toEqual([]);
  });

  it("returns unavailable true when reading recent plays result fails", async () => {
    jest
      .spyOn(db.recentPlays, "orderBy")
      .mockImplementationOnce(() => {
        throw new Error("IndexedDB unavailable");
      });

    await expect(getRecentPlaysResult()).resolves.toEqual({
      recentPlays: [],
      unavailable: true,
    });
  });

  it("does not reject when recording a recent play fails", async () => {
    jest.spyOn(console, "debug").mockImplementation(() => {});
    jest
      .spyOn(db, "transaction")
      .mockRejectedValueOnce(new Error("Quota exceeded"));

    await expect(addRecentPlay("track-1")).resolves.toBeUndefined();
    expect(console.debug).toHaveBeenCalledWith(
      "Failed to record recent play:",
      expect.any(Error),
    );
    expect(mockCaptureIndexedDbUnavailableEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "recent_plays_write",
        retryable: false,
        trackId: "track-1",
      }),
    );
  });
});
