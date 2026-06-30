import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  getAudioInstance,
  getAudioContext,
  getAnalyser,
  getAudioCapabilities,
  cleanupAudioInstance,
} from "@/shared/lib/audioInstance";
import { AudioInstanceState } from "@/shared/types/dataType";

const useAudioInstanceStore = create<AudioInstanceState>()(
  subscribeWithSelector(() => {
    let audioContext: AudioContext | null = null;
    let audioInstance: HTMLAudioElement | null = null;

    if (typeof window === "undefined") {
      return {
        audioInstance: null,
        audioContext: null,
        audioAnalyser: null,
        audioCapabilities: {
          audioElementAvailable: false,
          audioContextAvailable: false,
          analyserAvailable: false,
          initializationError: "Not in a browser environment",
        },
        cleanAudioInstance: () => {},
      };
    }

    audioInstance = getAudioInstance();
    audioContext = getAudioContext();

    return {
      audioInstance,
      audioContext,
      audioAnalyser: getAnalyser(),
      audioCapabilities: getAudioCapabilities(),
      cleanAudioInstance: cleanupAudioInstance,
    };
  })
);

export default useAudioInstanceStore;
