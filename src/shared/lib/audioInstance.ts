import { applyCrossfadeSchedule, computeFade } from "@/shared/lib/crossfade";
import { logger } from "@/shared/lib/logger";
import {
  applyEqualizerPreset,
  createEqualizerFilters,
  getDefaultPreset,
} from "@/shared/lib/equalizer";

/*
  TODO:
    Web Audio API 는 웹에서 오디오에 이펙트를 추가하거나, 파형을 시각화 하는등 다양한 기능을 구현할 수 있도록 도와준다.
    Web Audio API 는 모든 작업을 AudioContext 내에서 처리한다.
    analyser를 이용하여 오디오 신호의 주파수 데이터로 비쥬얼라이저 시각화 처리하였다.
    웹 정책으로 인해 클라이언트가 접근하자마자 오디오를 자동 재생하는 것이 불가능하다.
    따라서 사용자 상호작용으로만 resume() 메서드가 작동한다.
*/

interface WindowWithWebKitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

type CrossfadingSlotId = "A" | "B";

type AudioSlot = {
  id: CrossfadingSlotId;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
};

export type AudioCapabilities = {
  audioElementAvailable: boolean;
  audioContextAvailable: boolean;
  analyserAvailable: boolean;
  initializationError: string | null;
};

const DEFAULT_AUDIO_CAPABILITIES: AudioCapabilities = {
  audioElementAvailable: false,
  audioContextAvailable: false,
  analyserAvailable: false,
  initializationError: null,
};

const DEFAULT_CROSSFADE_DURATION_SEC = 0;
const MIN_GAIN = 0;
const MAX_GAIN = 1;

const clampCrossfadeDuration = (duration: number): number => {
  if (!Number.isFinite(duration)) {
    return 0;
  }

  return Math.max(0, duration);
};

const clampTrackToGain = (value: number): number => {
  return Math.min(MAX_GAIN, Math.max(MIN_GAIN, value));
};

class AudioSingletonInstance {
  private static instance: AudioSingletonInstance | null = null;
  public audio: HTMLAudioElement | null = null;
  public audioContext: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public equalizerFilters: BiquadFilterNode[] = [];
  public audioCapabilities: AudioCapabilities = {
    ...DEFAULT_AUDIO_CAPABILITIES,
  };

  private fallbackAudio: HTMLAudioElement;
  private audioSlots: AudioSlot[] = [];
  private activeSlotIndex = 0;
  private masterVolume = 1;
  private pendingTransition = 0;
  private pendingFadePauseTimer: ReturnType<typeof window.setTimeout> | number | NodeJS.Timeout | null = null;

  private constructor() {
    this.fallbackAudio = this.createAudioElement("A");
    this.audio = this.fallbackAudio;
    this.audioCapabilities.audioElementAvailable = true;

    // Browser only
    if (typeof window !== "undefined") {
      const Globalwindow = window as WindowWithWebKitAudioContext;
      const AudioContextConstructor =
        window.AudioContext || Globalwindow.webkitAudioContext;

      if (!AudioContextConstructor) {
        this.audioCapabilities.initializationError = "AudioContext not supported";
        logger.error(
          "AudioSingletonInstance: AudioContext not supported in this environment.",
        );
        return;
      }

      try {
        this.audioContext = new AudioContextConstructor();
        this.audioCapabilities.audioContextAvailable = true;
      } catch (error) {
        this.audioCapabilities.initializationError =
          error instanceof Error
            ? error.message
            : "AudioContext initialization failed";
        logger.error(
          "AudioSingletonInstance: AudioContext failed to initialize.",
          error,
        );
        return;
      }

      this.connectDualSources();
    } else {
      this.audioCapabilities.initializationError = "Not in a browser environment";
      logger.error("AudioSingletonInstance: not in a browser environment.");
    }
  }

  private createAudioElement(slotId: CrossfadingSlotId): HTMLAudioElement {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = "";
    audio.loop = false;
    audio.volume = this.masterVolume;

    logger.debug(`HTMLAudioElement instance (${slotId}) created`);
    return audio;
  }

  private createSlot(
    context: AudioContext,
    slotId: CrossfadingSlotId,
  ): AudioSlot {
    const audio = this.createAudioElement(slotId);
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();

    gain.gain.value = slotId === "A" ? 1 : 0;
    source.connect(gain);

    return {
      id: slotId,
      audio,
      source,
      gain,
    };
  }

  private connectDualSources() {
    if (!this.audioContext) {
      return;
    }

    try {
      const first = this.createSlot(this.audioContext, "A");
      const second = this.createSlot(this.audioContext, "B");
      this.audioSlots = [first, second];
      this.activeSlotIndex = 0;
      this.audio = first.audio;

      this.equalizerFilters = createEqualizerFilters(this.audioContext);
      applyEqualizerPreset(getDefaultPreset(), this.equalizerFilters);

      this.analyser = this.audioContext.createAnalyser();
      this.connectSignalChain();
      this.analyser.connect(this.audioContext.destination);
      this.analyser.fftSize = 512;
      this.audioCapabilities.analyserAvailable = true;

      logger.debug("Web Audio API components initialized");
    } catch (error) {
      this.resetGraphOnError(error);
    }
  }

  private connectSignalChain() {
    if (!this.analyser || this.audioSlots.length < 1) {
      return;
    }
    const analyser = this.analyser;

    this.equalizerFilters.forEach((filter) => filter.disconnect());
    this.audioSlots.forEach((slot) => slot.gain.disconnect());

    if (this.equalizerFilters.length === 0) {
      this.audioSlots.forEach((slot) => {
        slot.gain.connect(analyser);
      });
      return;
    }

    const firstFilter = this.equalizerFilters[0];
    if (!firstFilter) {
      return;
    }

    this.audioSlots.forEach((slot) => {
      slot.gain.connect(firstFilter);
    });

    for (let index = 0; index < this.equalizerFilters.length; index += 1) {
      const filter = this.equalizerFilters[index];
      const nextFilter = this.equalizerFilters[index + 1];
      if (nextFilter) {
        filter.connect(nextFilter);
      }
    }

    const lastFilter = this.equalizerFilters[this.equalizerFilters.length - 1];
    if (lastFilter) {
      lastFilter.connect(analyser);
    }
  }

  private get activeSlot(): AudioSlot {
    return this.audioSlots[this.activeSlotIndex];
  }

  private get inactiveSlot(): AudioSlot {
    return this.audioSlots[(this.activeSlotIndex + 1) % 2];
  }

  private clearActivePauseTimer() {
    if (this.pendingFadePauseTimer) {
      clearTimeout(this.pendingFadePauseTimer);
      this.pendingFadePauseTimer = null;
    }
  }

  private setActiveSlot(index: number) {
    if (index < 0 || index >= this.audioSlots.length) {
      return;
    }

    if (index === this.activeSlotIndex) {
      return;
    }

    this.activeSlotIndex = index;
    this.audio = this.audioSlots[index].audio;
  }

  private schedulePauseAfterTransition(
    slot: HTMLAudioElement,
    transitionId: number,
    durationSec: number,
  ) {
    this.clearActivePauseTimer();

    if (durationSec <= 0) {
      slot.pause();
      return;
    }

    const waitMs = Math.max(0, Math.ceil(durationSec * 1000));
    this.pendingFadePauseTimer = window.setTimeout(() => {
      if (this.pendingTransition !== transitionId) {
        return;
      }
      slot.pause();
    }, waitMs);
  }

  private setTrackOnSlot(slot: AudioSlot, trackUrl: string) {
    if (slot.audio.src !== trackUrl) {
      slot.audio.src = trackUrl;
      slot.audio.load();
    }
    slot.audio.currentTime = 0;
  }

  private ensureContextResumed() {
    if (!this.audioContext) {
      return Promise.resolve();
    }

    if (this.audioContext.state === "suspended") {
      return this.audioContext.resume();
    }

    return Promise.resolve();
  }

  private normalizeTrackSource(audio: HTMLAudioElement) {
    return audio.currentSrc || audio.src;
  }

  private fallbackTrackAudio(shouldPlay: boolean): Promise<HTMLAudioElement | null> {
    if (!this.fallbackAudio) {
      return Promise.resolve(null);
    }

    if (shouldPlay) {
      return this.fallbackAudio.play().then(() => this.fallbackAudio);
    }

    this.fallbackAudio.pause();
    return Promise.resolve(this.fallbackAudio);
  }

  private resolveCrossfadeDuration(
    requestedDuration: number,
    outgoingTrackDuration: number,
    incomingTrackDuration: number,
  ): number {
    const clampedDuration = clampCrossfadeDuration(requestedDuration);
    if (!Number.isFinite(outgoingTrackDuration) ||
      !Number.isFinite(incomingTrackDuration) ||
      outgoingTrackDuration <= 0 ||
      incomingTrackDuration <= 0) {
      return clampedDuration;
    }

    const shortest = Math.min(outgoingTrackDuration, incomingTrackDuration);
    return clampedDuration > shortest ? 0 : clampedDuration;
  }

  private setSlotGain(slot: AudioSlot, gain: number, time: number) {
    const gainNode = slot.gain;
    const nextGain = clampTrackToGain(gain);

    gainNode.gain.cancelScheduledValues(time);
    gainNode.gain.setValueAtTime(nextGain, time);
  }

  private async applyTrackWithCrossfade(
    targetTrack: string,
    transitionId: number,
    crossfadeDurationSec: number,
    shouldResumeContext: boolean,
  ) {
    const activeSlot = this.activeSlot;
    const inactiveSlot = this.inactiveSlot;

    if (!this.audioContext) {
      return null;
    }

    const activeSrc = this.normalizeTrackSource(activeSlot.audio);
    const crossfadeDuration = this.resolveCrossfadeDuration(
      crossfadeDurationSec,
      Number(activeSlot.audio.duration),
      Number(inactiveSlot.audio.duration),
    );

    this.setTrackOnSlot(inactiveSlot, targetTrack);

    if (shouldResumeContext) {
      await this.ensureContextResumed();
    }

    const now = this.audioContext.currentTime;
    const canCrossfade =
      crossfadeDuration > 0 &&
      activeSrc !== "" &&
      !activeSlot.audio.paused &&
      activeSlot.audio.currentTime > 0;

    if (canCrossfade) {
      this.setSlotGain(inactiveSlot, MIN_GAIN, now);
      this.setSlotGain(activeSlot, MAX_GAIN, now);

      applyCrossfadeSchedule(
        inactiveSlot.gain,
        computeFade({
          direction: "fadeIn",
          startTime: now,
          durationSec: crossfadeDuration,
        }),
      );

      applyCrossfadeSchedule(
        activeSlot.gain,
        computeFade({
          direction: "fadeOut",
          startTime: now,
          durationSec: crossfadeDuration,
        }),
      );
    } else {
      this.setSlotGain(activeSlot, MIN_GAIN, now);
      this.setSlotGain(inactiveSlot, MAX_GAIN, now);
      inactiveSlot.audio.volume = this.masterVolume;
      activeSlot.audio.volume = this.masterVolume;
      this.clearActivePauseTimer();
    }

    await inactiveSlot.audio.play();
    this.setActiveSlot(this.audioSlots.indexOf(inactiveSlot));

    this.pendingTransition = transitionId;
    this.schedulePauseAfterTransition(activeSlot.audio, transitionId, crossfadeDuration);

    return this.audio;
  }

  private applyTrackNoCrossfade(targetTrack: string, shouldResumeContext: boolean) {
    const activeSlot = this.activeSlot;

    this.setTrackOnSlot(activeSlot, targetTrack);

    if (shouldResumeContext) {
      return this.ensureContextResumed().then(() => activeSlot.audio.play().then(() => activeSlot.audio));
    }

    return Promise.resolve(activeSlot.audio);
  }

  public async applyTrack(
    trackUrl: string,
    shouldPlay: boolean,
    _crossfadeDurationSec = DEFAULT_CROSSFADE_DURATION_SEC,
  ): Promise<HTMLAudioElement | null> {
    const transitionId = ++this.pendingTransition;

    if (!this.audio) {
      return null;
    }

    if (!trackUrl) {
      if (this.audioSlots.length === 0) {
        await this.fallbackTrackAudio(false);
        return this.fallbackAudio;
      }

      this.audioSlots.forEach((slot) => {
        this.setSlotGain(slot, slot === this.activeSlot ? MAX_GAIN : MIN_GAIN, this.audioContext?.currentTime ?? 0);
      });
      this.stopAll();
      return this.audio;
    }

    const shouldResumeContext = !!this.audioContext;

    if (this.audioSlots.length === 0) {
      if (this.audio.src !== trackUrl) {
        this.audio.src = trackUrl;
        this.audio.load();
      }

      if (!shouldPlay) {
        this.audio.pause();
        return this.audio;
      }

      if (this.audioContext?.state === "suspended") {
        await this.ensureContextResumed();
      }

      await this.audio.play();
      return this.audio;
    }

    const activeSlot = this.activeSlot;
    const activeTrack = this.normalizeTrackSource(activeSlot.audio);
    const audioCurrentTime = this.audioContext?.currentTime ?? 0;

    if (!shouldPlay) {
      this.setTrackOnSlot(activeSlot, trackUrl);
      this.setSlotGain(activeSlot, MAX_GAIN, audioCurrentTime);
      this.setSlotGain(this.inactiveSlot, MIN_GAIN, audioCurrentTime);
      activeSlot.audio.pause();
      activeSlot.audio.currentTime = 0;
      return activeSlot.audio;
    }

    if (trackUrl === activeTrack) {
      await this.ensureContextResumed();
      this.setSlotGain(activeSlot, MAX_GAIN, audioCurrentTime);
      this.setSlotGain(this.inactiveSlot, MIN_GAIN, audioCurrentTime);
      await activeSlot.audio.play();
      return activeSlot.audio;
    }

    return this.applyTrackWithCrossfade(
      trackUrl,
      transitionId,
      clampCrossfadeDuration(_crossfadeDurationSec),
      shouldResumeContext,
    );
  }

  public setMasterAudioVolume(volume: number): void {
    const normalizedVolume = clampTrackToGain(volume);
    this.masterVolume = normalizedVolume;

    if (this.audioSlots.length > 0) {
      this.audioSlots.forEach((slot) => {
        slot.audio.volume = normalizedVolume;
      });
      return;
    }

    if (this.audio) {
      this.audio.volume = normalizedVolume;
    }
  }

  public stopAll(): void {
    if (this.audioSlots.length === 0) {
      if (this.fallbackAudio) {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      }
      return;
    }

    this.audioSlots.forEach((slot) => {
      slot.audio.pause();
      slot.audio.currentTime = 0;
    });

    const now = this.audioContext?.currentTime ?? 0;
    this.audioSlots.forEach((slot) => {
      this.setSlotGain(slot, slot === this.activeSlot ? 1 : 0, now);
    });
  }

  private resetGraphOnError(error: unknown) {
    this.analyser = null;
    this.audioCapabilities.analyserAvailable = false;
    this.audioCapabilities.initializationError =
      error instanceof Error
        ? error.message
        : "Audio analyser initialization failed";

    this.audioSlots.forEach((slot) => {
      try {
        slot.source.disconnect();
      } catch {
        // ignore
      }

      try {
        slot.gain.disconnect();
      } catch {
        // ignore
      }

      slot.audio.src = "";
    });

    this.equalizerFilters.forEach((filter) => filter.disconnect());
    this.equalizerFilters = [];

    this.audio = this.fallbackAudio;
    this.audioSlots = [];
    this.loggerError(
      "AudioSingletonInstance: Web Audio analyser failed to initialize.",
      error,
    );
  }

  private loggerError(message: string, error: unknown) {
    logger.error(message, error);
  }

  public static getInstance(): AudioSingletonInstance {
    if (!AudioSingletonInstance.instance) {
      AudioSingletonInstance.instance = new AudioSingletonInstance();
    }
    return AudioSingletonInstance.instance;
  }

  public static cleanup(): void {
    const instance = AudioSingletonInstance?.instance;

    if (instance) {
      instance.clearActivePauseTimer();

      instance.audioSlots.forEach((slot) => {
        slot.source.disconnect();
        slot.gain.disconnect();
        slot.audio.pause();
        slot.audio.src = "";
      });

      instance.equalizerFilters.forEach((filter) => filter.disconnect());
      instance.equalizerFilters = [];

      if (instance.audio) {
        instance.audio.pause();
        instance.audio.src = "";
      }

      if (instance.fallbackAudio && instance.fallbackAudio !== instance.audio) {
        instance.fallbackAudio.pause();
        instance.fallbackAudio.src = "";
      }

      if (instance.analyser) {
        instance.analyser.disconnect();
      }

      if (instance.audioContext && instance.audioContext.state !== "closed") {
        instance.audioContext
          .close()
          .then(() =>
            logger.debug(
              "AudioSingletonInstance: AudioContext closed successfully."
            )
          )
          .catch((err) =>
            logger.error(
              "AudioSingletonInstance: Error closing AudioContext:",
              err
            )
          );
      }

      AudioSingletonInstance.instance = null;
      logger.debug("AudioSingletonInstance: Instance cleaned up and reset.");
    }
  }
}

// 헬퍼 함수
export const getAudioInstance = () => {
  if (typeof window === "undefined") return null;
  const instance = AudioSingletonInstance.getInstance();
  return instance.audio;
};

export const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const instance = AudioSingletonInstance.getInstance();
  return instance.audioContext;
};

export const getAnalyser = () => {
  if (typeof window === "undefined") return null;
  const instance = AudioSingletonInstance.getInstance();
  return instance.analyser;
};

export const getEqualizerFilters = () => {
  if (typeof window === "undefined") return [];
  const instance = AudioSingletonInstance.getInstance();
  return instance.equalizerFilters;
};

export const getAudioCapabilities = (): AudioCapabilities => {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_AUDIO_CAPABILITIES,
      initializationError: "Not in a browser environment",
    };
  }

  const instance = AudioSingletonInstance.getInstance();
  return { ...instance.audioCapabilities };
};

export const transitionAudioTrack = (
  trackUrl: string,
  shouldPlay: boolean,
  crossfadeDurationSec = DEFAULT_CROSSFADE_DURATION_SEC,
) => {
  if (typeof window === "undefined") return Promise.resolve(null);
  const instance = AudioSingletonInstance.getInstance();
  return instance.applyTrack(
    trackUrl,
    shouldPlay,
    crossfadeDurationSec,
  );
};

export const setMasterAudioVolume = (volume: number) => {
  if (typeof window === "undefined") return;
  const instance = AudioSingletonInstance.getInstance();
  instance.setMasterAudioVolume(volume);
};

export const stopAllAudioTracks = () => {
  if (typeof window === "undefined") return;
  const instance = AudioSingletonInstance.getInstance();
  instance.stopAll();
};

export const cleanupAudioInstance = (): void => {
  AudioSingletonInstance.cleanup();
};
