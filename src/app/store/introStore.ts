import { create } from "zustand";

interface IntroState {
  isIntroVisible: boolean;
  hideIntro: () => void;
}

export const useIntroStore = create<IntroState>((set) => ({
  isIntroVisible: true,
  hideIntro: () => set({ isIntroVisible: false }),
}));
