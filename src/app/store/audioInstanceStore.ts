import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  getAudioInstance,
  getAudioContext,
  getAnalyser,
  cleanupAudioInstance,
} from "@/shared/lib/audioInstance";
import { AudioInstanceState } from "@/shared/types/dataType";

const useAudioInstanceStore = create<AudioInstanceState>()(
  subscribeWithSelector((set) => {
    let audioContext: AudioContext | null = null;
    let audioInstance: HTMLAudioElement | null = null;

    if (typeof window === "undefined") {
      return {
        audioInstance: null,
        audioContext: null,
        audioAnalyser: null,
        cleanAudioInstance: () => {},
      };
    }

    audioInstance = getAudioInstance();
    audioContext = getAudioContext();
    return {
      audioInstance,
      audioContext,
      audioAnalyser: getAnalyser(),
      cleanAudioInstance: cleanupAudioInstance,
    };
  })
);

export default useAudioInstanceStore;
