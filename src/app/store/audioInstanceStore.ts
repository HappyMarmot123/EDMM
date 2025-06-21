import { create } from "zustand";
import {
  getAudioInstance,
  getAudioContext,
  getAnalyser,
  cleanupAudioInstance,
} from "@/shared/lib/audioInstance";
import { AudioInstanceState } from "@/shared/types/dataType";

const useAudioInstanceStore = create<AudioInstanceState>(() => {
  if (typeof window === "undefined") {
    return {
      audioInstance: null,
      audioContext: null,
      audioAnalyser: null,
      cleanAudioInstance: () => {},
    };
  }

  return {
    audioInstance: getAudioInstance(),
    audioContext: getAudioContext(),
    audioAnalyser: getAnalyser(),
    cleanAudioInstance: cleanupAudioInstance,
  };
});

export default useAudioInstanceStore;
