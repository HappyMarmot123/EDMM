import type { Track } from "@/entities/track";
import {
  addEdmmEventListener,
  dispatchEdmmEvent,
  EDMM_EVENTS,
} from "@/shared/lib/edmmEvents";

const track: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl: "https://example.com/art.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/audio.mp3",
  metadata: {},
};

describe("edmmEvents", () => {
  it("dispatches typed player fullscreen events", () => {
    const listener = jest.fn();
    const cleanup = addEdmmEventListener(
      window,
      EDMM_EVENTS.openPlayerFullscreen,
      listener,
    );

    dispatchEdmmEvent(window, EDMM_EVENTS.openPlayerFullscreen, { track });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { track },
      }),
    );

    cleanup();
  });

  it("removes typed event listeners", () => {
    const listener = jest.fn();
    const cleanup = addEdmmEventListener(
      window,
      EDMM_EVENTS.playerTrackZoneSelect,
      listener,
    );

    cleanup();
    dispatchEdmmEvent(window, EDMM_EVENTS.playerTrackZoneSelect, {
      trackId: "track-1",
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
