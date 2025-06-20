import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addRecentAssetId } from "./service/storeService";
import { RecentPlayState } from "@/shared/types/dataType";

const useRecentPlayStore = create<RecentPlayState>()(
  persist(
    (set) => ({
      recentAssetIds: new Set(),
      addRecentAssetId: addRecentAssetId(set),
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
