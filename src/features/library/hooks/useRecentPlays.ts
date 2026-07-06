import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getRecentPlaysResult } from "@/shared/db";

export function useRecentPlays() {
  const recentResult = useLiveQuery(
    getRecentPlaysResult,
    [],
    { recentPlays: [], unavailable: false },
  );
  const recentIds = useMemo(
    () => recentResult.recentPlays.map((recentPlay) => recentPlay.trackId),
    [recentResult.recentPlays],
  );

  return {
    recentIds,
    isUnavailable: recentResult.unavailable,
  };
}
