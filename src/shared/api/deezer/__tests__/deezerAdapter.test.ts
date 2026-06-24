import { adaptDeezerTrack, type DeezerTrackRaw } from "../deezerAdapter";

it("maps deezer preview to streamUrl", () => {
  const raw = {
    id: 7,
    title: "D",
    duration: 200,
    artist: { id: 9, name: "Ar" },
    album: { title: "Al", cover_medium: "c" },
    preview: "https://prev.mp3",
  } satisfies DeezerTrackRaw;

  const t = adaptDeezerTrack(raw);

  expect(t.id).toBe("deezer:7");
  expect(t.source).toBe("deezer");
  expect(t.streamUrl).toBe("https://prev.mp3");
  expect(t.durationMs).toBe(200000);
});

it("falls back to empty artworkUrl when cover_medium is missing", () => {
  const raw = {
    id: 8,
    title: "No Cover",
    duration: 30,
    artist: { id: 10, name: "Artist" },
    album: { title: "Album" },
    preview: "https://preview.example/track.mp3",
  } satisfies DeezerTrackRaw;

  const t = adaptDeezerTrack(raw);

  expect(t.artworkUrl).toBe("");
});

it("falls back when nested deezer data is missing", () => {
  const raw = {
    id: 9,
    title: null,
    duration: Number.NaN,
    artist: null,
    album: null,
    preview: null,
  } satisfies DeezerTrackRaw;

  const t = adaptDeezerTrack(raw);

  expect(t.title).toBe("Untitled");
  expect(t.artistId).toBe("unknown");
  expect(t.artistName).toBe("Unknown Artist");
  expect(t.albumName).toBe("Unknown Album");
  expect(t.artworkUrl).toBe("");
  expect(t.durationMs).toBe(0);
  expect(t.streamUrl).toBe("");
  expect(t.metadata).toEqual({ rawId: 9 });
});
