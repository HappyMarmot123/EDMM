"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  InfiniteScrollContextType,
  InfiniteScrollProviderProps,
} from "@/shared/types/dataType";

const InfiniteScrollContext = createContext<
  InfiniteScrollContextType | undefined
>(undefined);

export const InfiniteScrollProvider = ({
  children,
  onLoadMore,
}: InfiniteScrollProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && onLoadMore) {
      setIsLoading(true);
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setHasMoreState = useCallback((more: boolean) => {
    setHasMore(more);
  }, []);

  const resetInfiniteScroll = useCallback(() => {
    setIsLoading(false);
    setHasMore(true);
  }, []);

  return (
    <InfiniteScrollContext.Provider
      value={{
        isLoading,
        hasMore,
        loadMore,
        setLoading,
        setHasMore: setHasMoreState,
        resetInfiniteScroll,
      }}
    >
      {children}
    </InfiniteScrollContext.Provider>
  );
};

export const useInfiniteScrollContext = () => {
  const context = useContext(InfiniteScrollContext);
  if (context === undefined) {
    throw new Error(
      "useInfiniteScrollContext must be used within an InfiniteScrollProvider"
    );
  }
  return context;
};
