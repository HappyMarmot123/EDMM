import { db } from "../../edmmDB";
import {
  addFavorite,
  getAllFavorites,
  isFavorite,
  toggleFavorite,
} from "../favoritesRepo";

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe("favoritesRepo", () => {
  it("toggles a favorite on and off", async () => {
    expect(await isFavorite("track-1")).toBe(false);

    expect(await toggleFavorite("track-1")).toBe(true);
    expect(await isFavorite("track-1")).toBe(true);
    expect(await getAllFavorites()).toHaveLength(1);

    expect(await toggleFavorite("track-1")).toBe(false);
    expect(await isFavorite("track-1")).toBe(false);
  });

  it("prevents duplicate favorites", async () => {
    await addFavorite("track-1");
    await addFavorite("track-1");

    expect(await getAllFavorites()).toHaveLength(1);
  });

  it("resolves concurrent duplicate add requests with one favorite row", async () => {
    await Promise.all([addFavorite("track-1"), addFavorite("track-1")]);

    const favorites = await getAllFavorites();
    expect(favorites.filter((favorite) => favorite.trackId === "track-1")).toHaveLength(
      1
    );
  });

  it("returns all favorites ordered by newest first", async () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValueOnce(200);

    await addFavorite("older-track");
    await addFavorite("newer-track");

    expect((await getAllFavorites()).map((favorite) => favorite.trackId)).toEqual([
      "newer-track",
      "older-track",
    ]);
  });
});
