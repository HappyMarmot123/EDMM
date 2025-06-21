"use client";

import {
  SpotifyTokenResponse,
  TrackObjectFull,
  SearchResponse,
} from "@/shared/types/dataType";
import { httpClient } from "@/shared/api/httpClient";
import { useState, useEffect } from "react";

const SPOTIFY_API_URL = process.env.NEXT_PUBLIC_SPOTIFY_API_BASE_URL;

const fetchAccessToken = async (): Promise<SpotifyTokenResponse> => {
  try {
    const response = await httpClient.request<SpotifyTokenResponse>({
      url: "/api/spotify-token",
      method: "GET",
    });

    if (response.error) {
      throw response.error;
    }

    if (!response.data?.access_token) {
      throw new Error("Access token not found in API response");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching access token from API route:", error);
    throw error;
  }
};

export const useGetSpotifyToken = () => {
  const [data, setData] = useState<SpotifyTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      const result = await fetchAccessToken();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    execute();
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
  };
};

const searchPopularEdmTracks = async (
  token: string,
  limit = 20
): Promise<TrackObjectFull[]> => {
  const response = await httpClient.request<SearchResponse>({
    url: `${SPOTIFY_API_URL}/search`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: "genre:edm",
      type: "track",
      limit: limit,
      market: "KR",
    },
  });

  if (response.error) {
    throw response.error;
  }

  if (!response.data) {
    throw new Error("No data received from Spotify");
  }

  return response.data.tracks.items.sort(
    (a: TrackObjectFull, b: TrackObjectFull) => b.popularity - a.popularity
  );
};

export const useSearchPopularEdmTracks = (limit = 20) => {
  const { data: tokenData, isLoading: isTokenLoading } = useGetSpotifyToken();
  const [data, setData] = useState<TrackObjectFull[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      if (!tokenData?.access_token) {
        throw new Error("Spotify token not available");
      }
      const result = await searchPopularEdmTracks(
        tokenData.access_token,
        limit
      );
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenData?.access_token) {
      execute();
    }
  }, [tokenData]);

  return {
    data,
    isLoading: isLoading || isTokenLoading,
    error,
    execute,
  };
};
