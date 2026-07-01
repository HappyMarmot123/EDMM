import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useMediaSession } from "@/shared/hooks/useMediaSession";
import type { Track } from "@/entities/track";

const TRACK: Track = {
  id: "track-1",
  source: "cloudinary",
  title: "Test Track",
  artistId: "artist-1",
  artistName: "Test Artist",
  albumName: "Test Album",
  artworkUrl: "https://example.com/artwork.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/track.mp3",
  metadata: {},
};

type SetActionHandler = (type: string, handler: ((...args: any[]) => void) | null) => void;

const createMediaSessionMock = () => {
  const handlers: Record<string, ((...args: any[]) => void) | null> = {};
  return {
    handlers,
    mediaSession: {
      setActionHandler: jest.fn<SetActionHandler>((type, handler) => {
        handlers[type] = handler;
      }),
      setPositionState: jest.fn(),
      metadata: null as MediaMetadata | null,
    },
  };
};

beforeEach(() => {
  (globalThis as any).MediaMetadata = class {
    constructor(init: Record<string, string | string[] | undefined>) {
      void init;
    }

    title?: string;
    artist?: string;
    album?: string;
    artwork?: { src: string }[];
  } as unknown as typeof MediaMetadata;
});

const installMediaSession = () => {
  const { handlers, mediaSession } = createMediaSessionMock();
  Object.defineProperty(navigator, "mediaSession", {
    configurable: true,
    value: mediaSession,
  });

  return { handlers, mediaSession };
};

function TestHost({
  track,
  children,
}: {
  track: Track | null;
  children?: ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180);
  const nextTrack = jest.fn();
  const prevTrack = jest.fn();
  const seekTo = jest.fn((time: number) => setCurrentTime(time));
  const togglePlayPause = jest.fn(() => setIsPlaying((prev) => !prev));

  useMediaSession({
    isPlaying,
    currentTrack: track,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
  });

  return (
    <div>
      {children}
      <button type="button" onClick={nextTrack}>
        Next
      </button>
    </div>
  );
}

describe("useMediaSession", () => {
  it("registers media session handlers and metadata when track exists", () => {
    const { mediaSession } = installMediaSession();

    render(<TestHost track={TRACK} />);

    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "play",
      expect.any(Function),
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "pause",
      expect.any(Function),
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "nexttrack",
      expect.any(Function),
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "previoustrack",
      expect.any(Function),
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "seekto",
      expect.any(Function),
    );
    expect(mediaSession.setPositionState).toHaveBeenCalledWith({
      duration: 180,
      position: 0,
      playbackRate: 1,
    });
  });

  it("does nothing when no track is selected", () => {
    const { mediaSession } = installMediaSession();

    render(<TestHost track={null} />);

    expect(mediaSession.setActionHandler).not.toHaveBeenCalled();
  });

  it("invokes action handlers and cleanup on unmount", () => {
    const { mediaSession, handlers } = installMediaSession();
    const { unmount } = render(<TestHost track={TRACK} />);

    expect(typeof handlers.play).toBe("function");
    unmount();

    expect(mediaSession.setActionHandler).toHaveBeenCalledWith("play", null);
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith("pause", null);
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "nexttrack",
      null,
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith(
      "previoustrack",
      null,
    );
    expect(mediaSession.setActionHandler).toHaveBeenCalledWith("seekto", null);
    expect(mediaSession.metadata).toBeNull();
  });
});
