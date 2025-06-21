import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addRecentAssetId,
  createRecentPlayStorage,
} from "./service/storeService";
import { RecentPlayState } from "@/shared/types/dataType";

const useRecentPlayStore = create<RecentPlayState>()(
  persist(
    (set) => ({
      recentAssetIds: new Set(),
      addRecentAssetId: addRecentAssetId(set),
    }),
    {
      name: "recent-play-store",
      storage: createRecentPlayStorage(),
      partialize: (state) => ({ recentAssetIds: state.recentAssetIds }),
    }
  )
);

export default useRecentPlayStore;
