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

class AudioSingletonInstance {
  private static instance: AudioSingletonInstance | null = null;
  public audio: HTMLAudioElement | null = null;
  public audioContext: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public source: MediaElementAudioSourceNode | null = null;
  public equalizerFilters: BiquadFilterNode[] = [];
  public audioCapabilities: AudioCapabilities = {
    ...DEFAULT_AUDIO_CAPABILITIES,
  };

  private constructor() {
    // Browser only
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
      this.audio.src = "";
      this.audio.loop = false;
      this.audioCapabilities.audioElementAvailable = true;
      logger.debug("HTMLAudioElement instance created");

      const Globalwindow = window as WindowWithWebKitAudioContext;
      const AudioContextConstructor =
        window.AudioContext || Globalwindow.webkitAudioContext;

      if (AudioContextConstructor) {
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
        }

        if (this.audio && this.audioContext) {
          try {
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.equalizerFilters = createEqualizerFilters(this.audioContext);
            applyEqualizerPreset(getDefaultPreset(), this.equalizerFilters);

            this.connectSignalChain();
            this.analyser.connect(this.audioContext.destination);
            this.analyser.fftSize = 512;
            this.audioCapabilities.analyserAvailable = true;

            logger.debug("Web Audio API components initialized");
          } catch (error) {
            this.resetGraphOnError(error);
          }
        } else {
          logger.error("HTMLAudioElement failed to initialize");
        }
      } else {
        this.audioCapabilities.initializationError = "AudioContext not supported";
        logger.error(
          "AudioSingletonInstance: AudioContext not supported in this environment.",
        );
      }
    } else {
      this.audioCapabilities.initializationError = "Not in a browser environment";
      logger.error("AudioSingletonInstance: not in a browser environment.");
    }
  }

  private connectSignalChain() {
    if (!this.source || !this.analyser) {
      return;
    }

    this.source.disconnect();
    this.equalizerFilters.forEach((filter) => filter.disconnect());

    if (this.equalizerFilters.length === 0) {
      this.source.connect(this.analyser);
      return;
    }

    this.source.connect(this.equalizerFilters[0]);

    this.equalizerFilters.forEach((filter, index) => {
      const nextFilter = this.equalizerFilters[index + 1];
      if (nextFilter) {
        filter.connect(nextFilter);
      }
    });

    const lastFilter = this.equalizerFilters[this.equalizerFilters.length - 1];
    if (lastFilter) {
      lastFilter.connect(this.analyser);
    }
  }

  public async applyTrack(
    trackUrl: string,
    shouldPlay: boolean,
    _crossfadeDurationSec = DEFAULT_CROSSFADE_DURATION_SEC,
  ): Promise<HTMLAudioElement | null> {
    if (!this.audio) {
      return null;
    }

    if (!trackUrl) {
      this.audio.pause();
      return this.audio;
    }

    if (this.audio.src !== trackUrl) {
      this.audio.src = trackUrl;
      this.audio.load();
    }

    if (!shouldPlay) {
      this.audio.pause();
      return this.audio;
    }

    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }

    await this.audio.play();
    return this.audio;
  }

  public setMasterAudioVolume(volume: number): void {
    if (!this.audio) {
      return;
    }

    this.audio.volume = volume;
  }

  public stopAll(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private resetGraphOnError(error: unknown) {
    this.analyser = null;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    this.equalizerFilters.forEach((filter) => {
      filter.disconnect();
    });
    this.equalizerFilters = [];

    this.audioCapabilities.analyserAvailable = false;
    this.audioCapabilities.initializationError =
      error instanceof Error
        ? error.message
        : "Audio analyser initialization failed";
    logger.error(
      "AudioSingletonInstance: Web Audio analyser failed to initialize.",
      error,
    );
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
      if (instance.audio) {
        instance.audio.pause();
        instance.audio.src = "";
      }

      if (instance.source) {
        instance.source.disconnect();
      }

      instance.equalizerFilters.forEach((filter) => filter.disconnect());
      instance.equalizerFilters = [];

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
