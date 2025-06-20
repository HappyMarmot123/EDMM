import { create } from "zustand";
import { setFavorites, toggleFavorite } from "./service/storeService";
import { FavoriteState } from "@/shared/types/dataType";

const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteAssetIds: new Set(),

  setFavorites: setFavorites(set),
  toggleFavorite: toggleFavorite(set, get),
}));

export default useFavoriteStore;
