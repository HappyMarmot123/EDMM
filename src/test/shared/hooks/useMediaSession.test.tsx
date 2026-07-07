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

type MediaSessionActionType = "play" | "pause" | "nexttrack" | "previoustrack" | "seekto";
type MediaSessionActionHandler = ((...args: unknown[]) => void) | null;

const createMediaSessionMock = () => {
  const handlers: Record<MediaSessionActionType, MediaSessionActionHandler> = {
    play: null,
    pause: null,
    nexttrack: null,
    previoustrack: null,
    seekto: null,
  };
  let metadataValue: MediaMetadata | null = null;
  const metadataAssignments: Array<MediaMetadata | null> = [];
  const mediaSession = {
    setActionHandler: jest.fn(
      (type: MediaSessionActionType, handler: MediaSessionActionHandler) => {
        handlers[type] = handler;
      },
    ),
    setPositionState: jest.fn(),
    metadata: null as MediaMetadata | null,
    playbackState: "none" as MediaSession["playbackState"],
    setCameraActive: jest.fn(),
    setMicrophoneActive: jest.fn(),
  } as unknown as MediaSession & {
    handlers?: Record<MediaSessionActionType, MediaSessionActionHandler>;
  };

  Object.defineProperty(mediaSession, "metadata", {
    configurable: true,
    get: () => metadataValue,
    set: (value: MediaMetadata | null) => {
      metadataValue = value;
      metadataAssignments.push(value);
    },
  });

  return {
    handlers,
    mediaSession,
    metadataAssignments,
  };
};

beforeEach(() => {
  (globalThis as Record<string, unknown>).MediaMetadata = class {
    constructor(init: {
      title?: string;
      artist?: string;
      album?: string;
      artwork?: { src: string }[];
    }) {
      this.title = init.title;
      this.artist = init.artist;
      this.album = init.album;
      this.artwork = init.artwork;
    }

    title?: string;
    artist?: string;
    album?: string;
    artwork?: { src: string }[];
  } as unknown as typeof MediaMetadata;
});

const installMediaSession = () => {
  const { handlers, mediaSession, metadataAssignments } =
    createMediaSessionMock();
  Object.defineProperty(navigator, "mediaSession", {
    configurable: true,
    value: mediaSession,
  });

  return { handlers, mediaSession, metadataAssignments };
};

function TestHost({
  track,
  children,
  currentTime = 0,
  duration = 180,
  seekTo,
  nextTrack,
  prevTrack,
  togglePlayPause,
  isPlayingOverride,
}: {
  track: Track | null;
  currentTime?: number;
  duration?: number;
  seekTo?: jest.Mock;
  nextTrack?: jest.Mock;
  prevTrack?: jest.Mock;
  togglePlayPause?: jest.Mock;
  isPlayingOverride?: boolean;
  children?: ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setCurrentTime] = useState(0);
  const onSeekTo = seekTo ?? jest.fn((time: number) => setCurrentTime(time));
  const onNextTrack = nextTrack ?? jest.fn();
  const onPrevTrack = prevTrack ?? jest.fn();
  const onTogglePlayPause =
    togglePlayPause ??
    jest.fn(() => {
      setIsPlaying((prev) => !prev);
    });
  const isPlayingValue = isPlayingOverride ?? isPlaying;

  useMediaSession({
    isPlaying: isPlayingValue,
    currentTrack: track,
    currentTime,
    duration,
    togglePlayPause: onTogglePlayPause,
    nextTrack: onNextTrack,
    prevTrack: onPrevTrack,
    seekTo: onSeekTo,
  });

  return (
    <div>
      {children}
      <button type="button" onClick={() => onNextTrack()}>
        Next
      </button>
      <button
        type="button"
        onClick={() => onPrevTrack()}
        aria-label="prev"
      />
      <button type="button" onClick={() => onTogglePlayPause()} aria-label="toggle" />
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

  it("updates position state when current time changes", () => {
    const { mediaSession } = installMediaSession();
    const { rerender, unmount } = render(<TestHost track={TRACK} currentTime={0} />);
    expect(mediaSession.setPositionState).toHaveBeenCalledWith({
      duration: 180,
      position: 0,
      playbackRate: 1,
    });

    rerender(<TestHost track={TRACK} currentTime={50} />);
    expect(mediaSession.setPositionState).toHaveBeenCalledWith({
      duration: 180,
      position: 50,
      playbackRate: 1,
    });
    unmount();
  });

  it("sets playback state for mobile system media controls", () => {
    const { mediaSession } = installMediaSession();
    const { rerender, unmount } = render(
      <TestHost track={TRACK} isPlayingOverride={false} />,
    );

    expect(mediaSession.playbackState).toBe("paused");

    rerender(<TestHost track={TRACK} isPlayingOverride={true} />);
    expect(mediaSession.playbackState).toBe("playing");

    unmount();
    expect(mediaSession.playbackState).toBe("none");
  });

  it("does not reset artwork metadata when only action callbacks change", () => {
    const { metadataAssignments } = installMediaSession();

    const { rerender } = render(
      <TestHost
        track={TRACK}
        nextTrack={jest.fn()}
        prevTrack={jest.fn()}
        togglePlayPause={jest.fn()}
      />,
    );

    expect(metadataAssignments.filter(Boolean)).toHaveLength(1);

    rerender(
      <TestHost
        track={TRACK}
        nextTrack={jest.fn()}
        prevTrack={jest.fn()}
        togglePlayPause={jest.fn()}
      />,
    );

    expect(metadataAssignments.filter(Boolean)).toHaveLength(1);
  });

  it("does not pass external artwork URLs to media session metadata", () => {
    const { mediaSession } = installMediaSession();

    render(<TestHost track={TRACK} />);

    expect(mediaSession.metadata).toMatchObject({
      title: "Test Track",
      artist: "Test Artist",
      album: "Test Album",
    });
    expect(mediaSession.metadata?.artwork).toBeUndefined();
  });

  it("clamps seek action to track duration", () => {
    const { handlers } = installMediaSession();
    const seekTo = jest.fn();
    render(<TestHost track={TRACK} duration={120} seekTo={seekTo} />);

    expect(typeof handlers.seekto).toBe("function");
    handlers.seekto?.({ seekTime: 181 });

    expect(seekTo).toHaveBeenCalledWith(120);
  });

  it("invokes togglePlayPause for play and pause actions", () => {
    const { handlers } = installMediaSession();
    const togglePlayPause = jest.fn(() => {});
    render(
      <TestHost
        track={TRACK}
        isPlayingOverride={true}
        togglePlayPause={togglePlayPause}
      />,
    );

    handlers.play?.();
    handlers.pause?.();

    expect(togglePlayPause).toHaveBeenCalledTimes(2);
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
