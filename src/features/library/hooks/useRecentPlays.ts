import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getRecentPlays } from "@/shared/db";

export function useRecentPlays() {
  const recentPlays = useLiveQuery(getRecentPlays, [], []);
  const recentIds = useMemo(
    () => recentPlays.map((recentPlay) => recentPlay.trackId),
    [recentPlays],
  );

  return { recentIds };
}
