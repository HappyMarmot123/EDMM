import { setFavorites, toggleFavorite } from "./service/storeService";
import { FavoriteState } from "@/shared/types/dataType";
import { createWithEqualityFn } from "zustand/traditional";

const useFavoriteStore = createWithEqualityFn<FavoriteState>(
  (set, get) => ({
    favoriteAssetIds: new Set(),

    setFavorites: setFavorites(set),
    toggleFavorite: toggleFavorite(set, get),
  }),
  (prev: any, next: any) =>
    prev.favoriteAssetIds.size === next.favoriteAssetIds.size
);

export default useFavoriteStore;
