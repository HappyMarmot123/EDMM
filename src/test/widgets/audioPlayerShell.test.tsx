import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track/model";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

const mockPlayTrack = jest.fn();

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  AudioPlayerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="audio-provider">{children}</div>
  ),
  useAudioPlayer: () => ({
    playTrack: mockPlayTrack,
  }),
}));

jest.mock("@/shared/providers/toggleProvider", () => ({
  ToggleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toggle-provider">{children}</div>
  ),
}));

jest.mock("@/widgets/audioPlayer", () => ({
  __esModule: true,
  default: () => <div data-testid="audio-widget" />,
}));

const track: Track = {
  id: "track-1",
  source: "audius",
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

  it("owns the audio provider for routes that render the player shell", () => {
    render(
      <AudioPlayerShell>
        {(onPlay) => (
          <button type="button" onClick={() => onPlay(track)}>
            Play
          </button>
        )}
      </AudioPlayerShell>
    );

    expect(screen.getByTestId("audio-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-widget")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(mockPlayTrack).toHaveBeenCalledWith(track);
  });
});
