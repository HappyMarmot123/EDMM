import { render, screen } from "@testing-library/react";
import DesktopFullscreenPlayer from "@/features/audio/components/desktopFullscreenPlayer";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";
import type { Track } from "@/entities/track";

jest.mock("@/features/audio/hooks/useArtworkCrossfade", () => ({
  useArtworkCrossfade: jest.fn(),
}));
jest.mock("@/features/audio/components/visualizers/albumColorPalette", () => ({
  ...jest.requireActual(
    "@/features/audio/components/visualizers/albumColorPalette",
  ),
  useAlbumColorPalette: () => ({
    palette: jest.requireActual(
      "@/features/audio/components/visualizers/albumColorPalette",
    ).FALLBACK_ALBUM_PALETTE,
    resolvedSrc: "",
  }),
}));
jest.mock("@/features/audio/components/fullscreenArtworkStage", () => ({
  __esModule: true,
  default: ({ artworkSrc }: { artworkSrc: string }) => (
    <div data-testid="artwork-stage" data-src={artworkSrc} />
  ),
}));
jest.mock("@/features/audio/components/fullscreenBackdrop", () => ({
  __esModule: true,
  default: ({ artworkSrc }: { artworkSrc: string }) => (
    <div data-testid="backdrop-layer" data-src={artworkSrc} />
  ),
}));
jest.mock("@/features/audio/components/fullscreenAudioVisualizer", () => ({
  __esModule: true,
  default: () => <canvas data-testid="fullscreen-visualizer" />,
}));

const mockUseArtworkCrossfade = useArtworkCrossfade as jest.MockedFunction<
  typeof useArtworkCrossfade
>;

const track: Track = {
  id: "track-2",
  source: "cloudinary",
  title: "Track Two",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl: "https://example.com/b.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/b.mp3",
  metadata: {},
};

const makeLayer = (key: number, src: string, opacity: number) => ({
  key,
  artworkSrc: src,
  hasArtwork: true,
  palette: FALLBACK_ALBUM_PALETTE,
  opacity,
});

describe("DesktopFullscreenPlayer artwork transition", () => {
  it("renders only the incoming artwork while both backdrop layers crossfade", () => {
    mockUseArtworkCrossfade.mockReturnValue({
      layers: [
        makeLayer(1, "https://example.com/a.jpg", 1),
        makeLayer(2, "https://example.com/b.jpg", 0),
      ],
      topPalette: FALLBACK_ALBUM_PALETTE,
      activateLayer: jest.fn(),
      completeLayer: jest.fn(),
    });

    render(
      <DesktopFullscreenPlayer
        currentTrackInfo={track}
        analyser={null}
        isPlaying={false}
        onClose={jest.fn()}
      />
    );

    const stages = screen.getAllByTestId("artwork-stage");
    expect(stages).toHaveLength(1); // 스냅 아웃: outgoing 아트워크는 렌더되지 않음
    expect(stages[0]).toHaveAttribute("data-src", "https://example.com/b.jpg");
    expect(screen.getAllByTestId("backdrop-layer")).toHaveLength(2); // backdrop은 크로스페이드 유지
  });

  it("completes the transition from the backdrop layer, not the artwork", () => {
    const completeLayer = jest.fn();
    mockUseArtworkCrossfade.mockReturnValue({
      layers: [
        makeLayer(1, "https://example.com/a.jpg", 1),
        makeLayer(2, "https://example.com/b.jpg", 1),
      ],
      topPalette: FALLBACK_ALBUM_PALETTE,
      activateLayer: jest.fn(),
      completeLayer,
    });

    render(
      <DesktopFullscreenPlayer
        currentTrackInfo={track}
        analyser={null}
        isPlaying={false}
        onClose={jest.fn()}
      />
    );

    const backdropWrappers = screen
      .getAllByTestId("backdrop-layer")
      .map((el) => el.parentElement!);
    backdropWrappers[1].dispatchEvent(
      Object.assign(new Event("transitionend", { bubbles: true }), {
        propertyName: "opacity",
      })
    );

    expect(completeLayer).toHaveBeenCalledWith(2);
  });
});
