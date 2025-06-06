"use client";

import {
  SpotifyTokenResponse,
  TrackObjectFull,
  SearchResponse,
} from "@/shared/types/dataType";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const SPOTIFY_API_URL = process.env.NEXT_PUBLIC_SPOTIFY_API_BASE_URL;
const ClientAPICall = axios.create({
  baseURL: SPOTIFY_API_URL,
});

const fetchAccessToken = async (): Promise<SpotifyTokenResponse> => {
  try {
    // TODO: 앱 내부의 api/spotify-token 경로로 요청
    const response = await fetch("/api/spotify-token");
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data: SpotifyTokenResponse = await response.json();
    if (!data.accessToken) {
      throw new Error("Access token not found in API response");
    }
    return data;
  } catch (error) {
    console.error("Error fetching access token from API route:", error);
    throw error; // Re-throw the error to be caught by React Query
  }
};

export const useGetSpotifyToken = () => {
  return useQuery<SpotifyTokenResponse, Error>({
    queryKey: ["spotifyAccessToken"],
    queryFn: fetchAccessToken,
    // Access data via query.state.data
    staleTime: (query) =>
      query.state.data?.expiresIn
        ? query.state.data.expiresIn * 1000
        : 60 * 55 * 1000,
    refetchInterval: (query) =>
      query.state.data?.expiresIn
        ? query.state.data.expiresIn * 1000
        : 60 * 55 * 1000,
    refetchOnWindowFocus: false, // Avoid refetching too often
  });
};

const searchPopularEdmTracks = async (
  token: string,
  limit = 20
): Promise<TrackObjectFull[]> => {
  const response = await ClientAPICall.get<SearchResponse>("/search", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: "genre:edm",
      type: "track",
      limit: limit,
      market: "KR",
    },
  });
  // Keep sorting logic
  return response.data.tracks.items.sort(
    (a: TrackObjectFull, b: TrackObjectFull) => b.popularity - a.popularity
  );
};

export const useSearchPopularEdmTracks = (limit = 20) => {
  const { data: tokenData } = useGetSpotifyToken(); // Get token data object
  return useQuery<TrackObjectFull[], Error>({
    queryKey: ["spotifyPopularEdmTracks", limit],
    queryFn: () => {
      if (!tokenData?.accessToken)
        throw new Error("Spotify token not available");
      return searchPopularEdmTracks(tokenData.accessToken, limit); // Use accessToken
    },
    enabled: !!tokenData?.accessToken,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
