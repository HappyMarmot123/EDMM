import {
  cleanupAudioInstance,
  transitionAudioTrack,
} from "@/shared/lib/audioInstance";

type AudioNodeMock = {
  connect: jest.Mock;
  disconnect: jest.Mock;
};

type AudioParamMock = {
  value: number;
  cancelScheduledValues: jest.Mock;
  setValueAtTime: jest.Mock;
  linearRampToValueAtTime: jest.Mock;
};

type GainNodeMock = AudioNodeMock & {
  gain: AudioParamMock;
};

let createdGainNodes: GainNodeMock[] = [];

const createAudioNodeMock = (): AudioNodeMock => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const createAudioParamMock = (value = 0): AudioParamMock => {
  const param: AudioParamMock = {
    value,
    cancelScheduledValues: jest.fn(),
    setValueAtTime: jest.fn((nextValue: number) => {
      param.value = nextValue;
    }),
    linearRampToValueAtTime: jest.fn((nextValue: number) => {
      param.value = nextValue;
    }),
  };
  return param;
};

const createGainNodeMock = (): GainNodeMock => {
  const gainNode = {
    ...createAudioNodeMock(),
    gain: createAudioParamMock(1),
  };
  createdGainNodes.push(gainNode);
  return gainNode;
};

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
    createdGainNodes = [];
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

  it("ramps the active track down before pausing and ramps it up on resume", async () => {
    jest.useFakeTimers();
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = jest.spyOn(window.HTMLMediaElement.prototype, "pause");
    const trackUrl = "https://example.com/audio.mp3";

    await transitionAudioTrack(trackUrl, true);
    const activeTrackGain = createdGainNodes[1].gain;

    playSpy.mockClear();
    pauseSpy.mockClear();
    activeTrackGain.setValueAtTime.mockClear();
    activeTrackGain.linearRampToValueAtTime.mockClear();

    await transitionAudioTrack(trackUrl, false);

    expect(activeTrackGain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.22);
    expect(pauseSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(220);

    expect(pauseSpy).toHaveBeenCalledTimes(1);

    activeTrackGain.setValueAtTime.mockClear();
    activeTrackGain.linearRampToValueAtTime.mockClear();

    await transitionAudioTrack(trackUrl, true);

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(activeTrackGain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(activeTrackGain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 0.16);

    jest.useRealTimers();
  });
});
