import { db } from "../edmmDB";

afterEach(async () => {
  await db.delete();
  await db.open();
});

describe("edmmDB", () => {
  it("opens with the expected tables and key/index definitions", async () => {
    await db.open();

    expect(db.tables.map((table) => table.name).sort()).toEqual([
      "audioSettings",
      "favorites",
      "playlistTracks",
      "playlists",
      "recentPlays",
      "trackCache",
    ]);

    const schemas = Object.fromEntries(
      db.tables.map((table) => [table.name, table.schema])
    );

    expect(schemas.favorites.primKey.keyPath).toBe("id");
    expect(schemas.favorites.primKey.auto).toBe(true);
    expect(schemas.favorites.idxByName.trackId.unique).toBe(true);

    expect(schemas.playlists.primKey.keyPath).toBe("id");
    expect(schemas.playlistTracks.idxByName.playlistId).toBeDefined();
    expect(schemas.recentPlays.idxByName.playedAt).toBeDefined();

    expect(schemas.trackCache.primKey.keyPath).toBe("trackId");
    expect(schemas.trackCache.idxByName.cachedAt).toBeDefined();

    expect(schemas.audioSettings.primKey.keyPath).toBe("key");
  });
});
