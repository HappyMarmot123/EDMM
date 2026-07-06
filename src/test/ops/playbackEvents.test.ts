import * as Sentry from "@sentry/nextjs";
import {
  capturePlaybackErrorEvent,
  resetPlaybackErrorEventCounts,
} from "@/shared/lib/sentry/playbackEvents";
import { PLAYBACK_ERROR_CODES } from "@/shared/providers/audioPlaybackErrors";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const captureMessage = Sentry.captureMessage as jest.Mock;

describe("capturePlaybackErrorEvent", () => {
  beforeEach(() => {
    captureMessage.mockClear();
    resetPlaybackErrorEventCounts();
  });

  it("captures source load failures with safe playback context only", () => {
    const trackWithRawFields = {
      id: "track-1",
      source: "cloudinary",
      title: "Raw title should not be sent",
      artistName: "Raw artist should not be sent",
      streamUrl: "https://example.com/private-audio.mp3",
      artworkUrl: "https://example.com/private-art.jpg",
    };

    capturePlaybackErrorEvent({
      errorCode: PLAYBACK_ERROR_CODES.sourceLoadFailed,
      route: "/search",
      retryable: false,
      track: trackWithRawFields,
    });

    expect(captureMessage).toHaveBeenCalledWith(
      "playback.track_playback_failed",
      expect.objectContaining({
        level: "error",
        tags: expect.objectContaining({
          error_class: "track_playback_failed",
          route: "/search",
          track_id: "track-1",
          track_source: "cloudinary",
        }),
        contexts: expect.objectContaining({
          playback: expect.objectContaining({
            errorCode: "source-load-failed",
            retryable: false,
            runtime: "browser",
            trackId: "track-1",
            trackSource: "cloudinary",
          }),
        }),
      }),
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "private-audio",
    );
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain(
      "Raw title",
    );
  });

  it("captures autoplay blocks only after a repeated failure", () => {
    const event = {
      errorCode: PLAYBACK_ERROR_CODES.autoplayBlocked,
      route: "/search",
      retryable: true,
      track: {
        id: "track-1",
        source: "cloudinary",
      },
    };

    capturePlaybackErrorEvent(event);

    expect(captureMessage).not.toHaveBeenCalled();

    capturePlaybackErrorEvent(event);

    expect(captureMessage).toHaveBeenCalledWith(
      "playback.autoplay_blocked",
      expect.objectContaining({
        level: "info",
        contexts: expect.objectContaining({
          playback: expect.objectContaining({
            occurrence: 2,
          }),
        }),
      }),
    );
  });
});
