import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_RECENT_ASSETS = 10;

interface RecentPlayState {
  recentAssetIds: Set<string>;
  addRecentAssetId: (assetId: string) => void;
}

const useRecentPlayStore = create<RecentPlayState>()(
  persist(
    (set) => ({
      recentAssetIds: new Set(),
      addRecentAssetId: (assetId) => {
        set((state) => {
          const newRecentAssetIds = new Set([assetId, ...state.recentAssetIds]);

          while (newRecentAssetIds.size > MAX_RECENT_ASSETS) {
            const oldestAssetId = Array.from(newRecentAssetIds).pop();
            if (oldestAssetId) {
              newRecentAssetIds.delete(oldestAssetId);
            }
          }

          return { recentAssetIds: newRecentAssetIds };
        });
      },
    }),
    {
      name: "recent-play-store",
      storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if (value instanceof Set) {
            return {
              dataType: "Set",
              value: Array.from(value),
            };
          }
          return value;
        },
        reviver: (key, value) => {
          if (typeof value === "object" && value !== null) {
            if ((value as any).dataType === "Set") {
              return new Set((value as any).value);
            }
          }
          return value;
        },
      }),
      partialize: (state) => ({ recentAssetIds: state.recentAssetIds }),
    }
  )
);

export default useRecentPlayStore;
