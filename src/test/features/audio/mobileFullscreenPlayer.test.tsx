import { render, screen } from "@testing-library/react";
import MobileFullscreenPlayer from "@/features/audio/components/mobile/mobileFullscreenPlayer";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";
import type { Track } from "@/entities/track";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    togglePlayPause: jest.fn(),
    prevTrack: jest.fn(),
    nextTrack: jest.fn(),
    currentTime: 30,
  }),
}));
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
jest.mock("@/features/audio/components/mobile/mFullscreenBackdrop", () => ({
  __esModule: true,
  default: ({ artworkSrc }: { artworkSrc: string }) => (
    <div data-testid="m-backdrop-layer" data-src={artworkSrc} />
  ),
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

describe("MobileFullscreenPlayer artwork transition", () => {
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
      <MobileFullscreenPlayer
        currentTrackInfo={track}
        duration={180}
        seek={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    // 스냅 아웃: 아트워크는 top 레이어만, backdrop은 두 레이어 크로스페이드
    const artworks = screen.getAllByAltText("Album One");
    expect(artworks).toHaveLength(1);
    expect(artworks[0]).toHaveAttribute(
      "src",
      expect.stringContaining("b.jpg"),
    );
    expect(screen.getAllByTestId("m-backdrop-layer")).toHaveLength(2);
  });

  it("completes the transition from the backdrop layer", () => {
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
      <MobileFullscreenPlayer
        currentTrackInfo={track}
        duration={180}
        seek={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const backdropWrappers = screen
      .getAllByTestId("m-backdrop-layer")
      .map((el) => el.parentElement!);
    backdropWrappers[1].dispatchEvent(
      Object.assign(new Event("transitionend", { bubbles: true }), {
        propertyName: "opacity",
      }),
    );

    expect(completeLayer).toHaveBeenCalledWith(2);
  });
});
