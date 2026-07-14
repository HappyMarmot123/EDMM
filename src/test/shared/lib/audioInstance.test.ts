import {
  applyAudioEqualizerPreset,
  cleanupAudioInstance,
  getEqualizerFilters,
  transitionAudioTrack,
} from "@/shared/lib/audioInstance";
import {
  dbToLinearGain,
  EQ_PRESET_GAINS,
  LIMITER_SETTINGS,
} from "@/shared/lib/equalizer";

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

type BiquadFilterMock = AudioNodeMock & {
  type: BiquadFilterType;
  frequency: { value: number };
  Q: { value: number };
  gain: AudioParamMock;
};

type CompressorNodeMock = AudioNodeMock & {
  threshold: { value: number };
  knee: { value: number };
  ratio: { value: number };
  attack: { value: number };
  release: { value: number };
};

let createdGainNodes: GainNodeMock[] = [];
let createdBiquadFilters: BiquadFilterMock[] = [];
let createdCompressors: CompressorNodeMock[] = [];
let createdAudioContexts: AudioContextMock[] = [];

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

const createBiquadFilterMock = (): BiquadFilterMock => {
  const filter = {
    ...createAudioNodeMock(),
    type: "peaking" as BiquadFilterType,
    frequency: { value: 0 },
    Q: { value: 0 },
    gain: createAudioParamMock(0),
  };
  createdBiquadFilters.push(filter);
  return filter;
};

const createCompressorMock = (): CompressorNodeMock => {
  const node = {
    ...createAudioNodeMock(),
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 1 },
    attack: { value: 0 },
    release: { value: 0 },
  };
  createdCompressors.push(node);
  return node;
};

class AudioContextMock {
  state: AudioContextState = "running";
  currentTime = 0;
  destination = createAudioNodeMock();

  constructor() {
    createdAudioContexts.push(this);
  }

  createMediaElementSource = jest.fn(() => createAudioNodeMock());
  createGain = jest.fn(() => createGainNodeMock());
  createBiquadFilter = jest.fn(() => createBiquadFilterMock());
  createDynamicsCompressor = jest.fn(() => createCompressorMock());
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
    createdBiquadFilters = [];
    createdCompressors = [];
    createdAudioContexts = [];
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

  it("inserts a preamp gain and a configured limiter into the graph", async () => {
    await transitionAudioTrack("https://example.com/audio.mp3", true);

    expect(createdGainNodes.length).toBeGreaterThanOrEqual(3);
    expect(createdCompressors).toHaveLength(1);
    expect(createdCompressors[0].threshold.value).toBe(
      LIMITER_SETTINGS.threshold,
    );
    expect(createdCompressors[0].ratio.value).toBe(LIMITER_SETTINGS.ratio);
  });

  it("applies preset gains and preamp headroom through the engine", async () => {
    await transitionAudioTrack("https://example.com/audio.mp3", true);

    applyAudioEqualizerPreset("bass");

    const filters = getEqualizerFilters();
    expect(filters).toHaveLength(10);
    expect(filters.map((filter) => filter.gain.value)).toEqual(
      EQ_PRESET_GAINS.bass,
    );

    const preamp = createdGainNodes[2];
    expect(preamp.gain.value).toBeCloseTo(dbToLinearGain(-5));
  });

  it("schedules preset filter and preamp ramps from the engine current time", async () => {
    await transitionAudioTrack("https://example.com/audio.mp3", true);
    const audioContext = createdAudioContexts[0];
    audioContext.currentTime = 12.25;

    const filters = getEqualizerFilters() as unknown as BiquadFilterMock[];
    const preamp = createdGainNodes[2];
    const currentTime = audioContext.currentTime;
    const rampEndTime = currentTime + 0.08;

    filters.forEach((filter) => {
      filter.gain.cancelScheduledValues.mockClear();
      filter.gain.setValueAtTime.mockClear();
      filter.gain.linearRampToValueAtTime.mockClear();
    });
    preamp.gain.cancelScheduledValues.mockClear();
    preamp.gain.setValueAtTime.mockClear();
    preamp.gain.linearRampToValueAtTime.mockClear();

    applyAudioEqualizerPreset("bass");

    expect(filters).toHaveLength(10);
    filters.forEach((filter, index) => {
      expect(filter.gain.cancelScheduledValues).toHaveBeenCalledWith(currentTime);
      expect(filter.gain.setValueAtTime).toHaveBeenCalledWith(0, currentTime);
      expect(filter.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        EQ_PRESET_GAINS.bass[index],
        rampEndTime,
      );
    });

    expect(preamp.gain.cancelScheduledValues).toHaveBeenCalledWith(currentTime);
    expect(preamp.gain.setValueAtTime).toHaveBeenCalledWith(1, currentTime);
    expect(preamp.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      dbToLinearGain(-5),
      rampEndTime,
    );
  });

  it("uses equal-power midpoint ramps for track-to-track crossfades", async () => {
    const firstTrack = "https://example.com/first.mp3";
    const secondTrack = "https://example.com/second.mp3";
    const activeAudio = await transitionAudioTrack(firstTrack, true);
    const audioContext = createdAudioContexts[0];
    audioContext.currentTime = 3;

    activeAudio!.currentTime = 14;
    Object.defineProperty(activeAudio!, "paused", {
      configurable: true,
      value: false,
    });

    const inactiveFadeInGain = createdGainNodes[0].gain;
    const activeFadeOutGain = createdGainNodes[1].gain;

    [inactiveFadeInGain, activeFadeOutGain].forEach((gainParam) => {
      gainParam.setValueAtTime.mockClear();
      gainParam.linearRampToValueAtTime.mockClear();
    });

    await transitionAudioTrack(secondTrack, true, 2);

    expect(inactiveFadeInGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      1,
      Math.SQRT1_2,
      4,
    );
    expect(inactiveFadeInGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      2,
      1,
      5,
    );
    expect(activeFadeOutGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      1,
      Math.SQRT1_2,
      4,
    );
    expect(activeFadeOutGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      2,
      0,
      5,
    );
  });
});
