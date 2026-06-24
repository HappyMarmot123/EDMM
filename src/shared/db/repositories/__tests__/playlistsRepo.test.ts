import { db } from "../../edmmDB";
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  getPlaylistTracks,
} from "../playlistsRepo";

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe("playlistsRepo", () => {
  it("creates a playlist and appends tracks in order", async () => {
    const playlistId = await createPlaylist("My Mix");

    await addTrackToPlaylist(playlistId, "t1");
    await addTrackToPlaylist(playlistId, "t2");

    expect(await getPlaylistTracks(playlistId)).toEqual(["t1", "t2"]);
  });

  it("returns playlists newest first", async () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValueOnce(200);

    await createPlaylist("Older Mix");
    await createPlaylist("Newer Mix");

    expect((await getPlaylists()).map((playlist) => playlist.name)).toEqual([
      "Newer Mix",
      "Older Mix",
    ]);
  });
});