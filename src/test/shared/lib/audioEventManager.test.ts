import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";

describe("setupAudioEventListeners", () => {
  it("ignores empty-source audio errors caused by cleanup", () => {
    const audio = document.createElement("audio");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    Object.defineProperty(audio, "currentSrc", {
      configurable: true,
      value: "",
    });
    Object.defineProperty(audio, "src", {
      configurable: true,
      value: window.location.href,
    });

    const cleanup = setupAudioEventListeners({
      state: {
        audio,
        storeSetCurrentTime: jest.fn(),
        storeSetDuration: jest.fn(),
        storeSetIsBuffering: jest.fn(),
      },
      isSeekingRef: { current: false },
      nextTrack: jest.fn(),
    });

    audio.dispatchEvent(new Event("error"));

    expect(consoleError).not.toHaveBeenCalled();

    cleanup();
    consoleError.mockRestore();
  });

  it("moves to next track when audio playback ends", () => {
    const audio = document.createElement("audio");
    const nextTrack = jest.fn();
    const cleanup = setupAudioEventListeners({
      state: {
        audio,
        storeSetCurrentTime: jest.fn(),
        storeSetDuration: jest.fn(),
        storeSetIsBuffering: jest.fn(),
      },
      isSeekingRef: { current: false },
      nextTrack,
    });

    audio.dispatchEvent(new Event("ended"));

    expect(nextTrack).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
