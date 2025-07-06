import { useOptimistic, useTransition } from "react";
import { useAuth } from "@/shared/providers/authProvider";
import useFavoriteStore from "@/app/store/favoriteStore";
import { toast } from "sonner";
import { httpClient } from "@/shared/api/httpClient";
import { debounce } from "lodash";
import {
  OptimisticFavoriteAction,
  OptimisticFavoriteState,
} from "@/shared/types/dataType";

// TODO:
// 리액트 훅 Optimistic(낙관처리)와 useTransition 조합

const optimisticFavoriteReducer = (
  state: OptimisticFavoriteState,
  action: OptimisticFavoriteAction
): OptimisticFavoriteState => {
  switch (action.type) {
    case "TOGGLE_FAVORITE":
      const newFavorites = new Set(state.favoriteAssetIds);
      if (newFavorites.has(action.assetId)) {
        newFavorites.delete(action.assetId);
      } else {
        newFavorites.add(action.assetId);
      }
      return {
        favoriteAssetIds: newFavorites,
        pendingToggle: action.assetId,
      };
    default:
      return state;
  }
};

// Entry HERE!!
export const useFavoriteAction = () => {
  const { user } = useAuth();
  const favoriteStore = useFavoriteStore();
  const [isPending, startTransition] = useTransition();

  const currentState: OptimisticFavoriteState = {
    favoriteAssetIds: favoriteStore.favoriteAssetIds,
    pendingToggle: null,
  };

  const [optimisticState, addOptimisticFavorite] = useOptimistic(
    currentState,
    optimisticFavoriteReducer
  );

  const toggleFavorite = (assetId: string) => {
    if (!user) {
      toast.error("You need to login to like tracks.");
      return;
    }

    addOptimisticFavorite({ type: "TOGGLE_FAVORITE", assetId });

    startTransition(async () => {
      try {
        const isCurrentlyFavorite = favoriteStore.favoriteAssetIds.has(assetId);
        const newIsFavorite = !isCurrentlyFavorite;

        // 실제 상태 업데이트 (즉시 반영)
        const newFavorites = new Set(favoriteStore.favoriteAssetIds);
        if (newIsFavorite) {
          newFavorites.add(assetId);
        } else {
          newFavorites.delete(assetId);
        }
        favoriteStore.setFavorites(newFavorites);

        const debouncedRequest = debounce(async () => {
          const response = await httpClient.request({
            url: "/api/supabase",
            method: "POST",
            payload: {
              assetId,
              userId: user.id,
              isFavorite: newIsFavorite,
            },
          });
          return response;
        }, 1000);

        await debouncedRequest();
      } catch (error) {
        favoriteStore.setFavorites(favoriteStore.favoriteAssetIds);
        const currentFavorites = new Set(favoriteStore.favoriteAssetIds);
        favoriteStore.setFavorites(currentFavorites);

        toast.error("Something went wrong. Could you try again?");
        console.error("Error liking track:", error);
      }
    });
  };

  return {
    toggleFavorite,
    isPending,
    isLoading: isPending,
    optimisticFavoriteIds: optimisticState.favoriteAssetIds,
    pendingToggle: optimisticState.pendingToggle,
    error: null,
    success: false,
    lastToggledAssetId: optimisticState.pendingToggle,
  };
};
