import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getAllFavorites,
  toggleFavorite,
} from "@/shared/db/repositories/favoritesRepo";

export function useFavorites() {
  const favorites = useLiveQuery(getAllFavorites, [], []);
  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.trackId)),
    [favorites],
  );
  const isFavorite = useCallback(
    (id: string) => favoriteIds.has(id),
    [favoriteIds],
  );

  return {
    favoriteIds,
    toggle: toggleFavorite,
    isFavorite,
  };
}
