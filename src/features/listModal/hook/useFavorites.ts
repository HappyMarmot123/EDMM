import { useQuery } from "@tanstack/react-query";
import { favorites } from "@/entities/ToggleFavorite/favoriteSchema";
import { useAuth } from "@/shared/providers/authProvider";
import { httpClient } from "@/shared/api/httpClient";

export type Favorite = typeof favorites.$inferSelect;

const fetchFavorites = async (): Promise<Set<string>> => {
  const response = await httpClient.request<Favorite[]>({
    url: "/api/supabase",
    method: "GET",
  });

  if (!response.data) {
    throw new Error("No data received from favorites API");
  }

  const newSetResponse = new Set(
    response.data.map((favorite) => favorite.asset_id)
  );
  return newSetResponse;
};

export const useFavorites = () => {
  const { user } = useAuth();
  return useQuery<Set<string>, Error>({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: fetchFavorites,
    staleTime: 1000 * 60 * 60, // 1시간
  });
};
