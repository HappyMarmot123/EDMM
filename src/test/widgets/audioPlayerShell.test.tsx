import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/Track/model";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

const mockPlayTrack = jest.fn();

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => ({
    playTrack: mockPlayTrack,
  }),
}));

const track: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Track One",
  artistId: "artist-1",
  artistName: "Artist One",
  artworkUrl: "https://example.com/art.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/track.mp3",
  metadata: {},
};

describe("AudioPlayerShell", () => {
  beforeEach(() => {
    mockPlayTrack.mockClear();
  });

  it("uses the global audio provider to inject play handlers", () => {
    render(
      <AudioPlayerShell>
        {(onPlay) => (
          <button type="button" onClick={() => onPlay(track)}>
            Play
          </button>
        )}
      </AudioPlayerShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(mockPlayTrack).toHaveBeenCalledWith(track);
  });
});
