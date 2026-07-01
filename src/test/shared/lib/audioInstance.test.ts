import {
  cleanupAudioInstance,
  transitionAudioTrack,
} from "@/shared/lib/audioInstance";

type AudioNodeMock = {
  connect: jest.Mock;
  disconnect: jest.Mock;
};

const createAudioNodeMock = (): AudioNodeMock => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const createAudioParamMock = (value = 0) => ({
  value,
  cancelScheduledValues: jest.fn(),
  setValueAtTime: jest.fn(),
  linearRampToValueAtTime: jest.fn(),
});

const createGainNodeMock = () => ({
  ...createAudioNodeMock(),
  gain: createAudioParamMock(1),
});

const createBiquadFilterMock = () => ({
  ...createAudioNodeMock(),
  type: "peaking" as BiquadFilterType,
  frequency: { value: 0 },
  Q: { value: 0 },
  gain: { value: 0 },
});

class AudioContextMock {
  state: AudioContextState = "running";
  currentTime = 0;
  destination = createAudioNodeMock();

  createMediaElementSource = jest.fn(() => createAudioNodeMock());
  createGain = jest.fn(() => createGainNodeMock());
  createBiquadFilter = jest.fn(() => createBiquadFilterMock());
  createAnalyser = jest.fn(() => ({
    ...createAudioNodeMock(),
    fftSize: 0,
  }));
  resume = jest.fn(async () => undefined);
  close = jest.fn(async () => undefined);
}

describe("audioInstance", () => {
  const originalAudioContext = window.AudioContext;
  const originalWebkitAudioContext = (
    window as typeof window & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;

  beforeEach(() => {
    cleanupAudioInstance();
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: AudioContextMock,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    jest
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockImplementation(async () => undefined);
    jest
      .spyOn(window.HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    jest
      .spyOn(window.HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanupAudioInstance();
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: originalAudioContext,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      writable: true,
      value: originalWebkitAudioContext,
    });
    jest.restoreAllMocks();
  });

  it("keeps the current playback position when pausing and resuming the active track", async () => {
    const trackUrl = "https://example.com/audio.mp3";
    const activeAudio = await transitionAudioTrack(trackUrl, true);

    expect(activeAudio).toBeInstanceOf(HTMLAudioElement);

    activeAudio!.currentTime = 42;

    await transitionAudioTrack(trackUrl, false);

    expect(activeAudio!.currentTime).toBe(42);

    await transitionAudioTrack(trackUrl, true);

    expect(activeAudio!.currentTime).toBe(42);
  });
});
