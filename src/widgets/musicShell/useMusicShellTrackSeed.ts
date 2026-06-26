import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { Track } from "@/entities/Track/model";
import { isPlayable } from "@/entities/Track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { buildRecentSeedKey, firstPlayableTrack } from "./trackSeedUtils";
import {
  resolveInitialSeedTrackWithCache,
  resolveRecentSeedTrackWithCache,
} from "./trackSeedUtils";

export type SelectionSource = "initial" | "visible";

type MusicShellSeedHookParams = {
  selectionSource: SelectionSource | null;
  selectedTrackId: string | null;
  selectedTrack: Track | null;
  visibleTracks: Track[];
  recentTrackIds: string[];
  queueForTrack: (track: Track) => Track[];
  activateTrackInPlayer: (
    track: Track,
    playImmediately?: boolean,
    source?: SelectionSource,
    queueOverride?: Track[],
  ) => void;
  fallbackToFirstPlayable: () => void;
  seededTrackRef: RefObject<string | null>;
};

const loadCachedTrack = async (trackId: string): Promise<Track | null> => {
  const track = await getCachedTrack(trackId);
  return track ?? null;
};

export const useMusicShellTrackSeed = ({
  selectionSource,
  selectedTrackId,
  selectedTrack,
  visibleTracks,
  recentTrackIds,
  queueForTrack,
  activateTrackInPlayer,
  fallbackToFirstPlayable,
  seededTrackRef,
}: MusicShellSeedHookParams) => {
  const loadTrackById = useCallback(async (trackId: string) => {
    try {
      return await loadCachedTrack(trackId);
    } catch {
      return null;
    }
  }, []);

  const resolvedInitialTrackRef = useRef<string | null>(null);
  const resolvedRecentTrackRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectionSource !== "initial" || !selectedTrackId) {
      return;
    }

    if (resolvedInitialTrackRef.current === selectedTrackId) {
      return;
    }

    resolvedInitialTrackRef.current = selectedTrackId;
    let isActive = true;

    void (async () => {
      const resolvedTrack = await resolveInitialSeedTrackWithCache({
        selectedTrackId,
        selectedTrack,
        visibleTracks,
        loadTrackById,
      });

      if (!isActive) {
        return;
      }

      if (!resolvedTrack) {
        fallbackToFirstPlayable();
        return;
      }

      activateTrackInPlayer(resolvedTrack, false, "initial", queueForTrack(resolvedTrack));
    })();

    return () => {
      isActive = false;
    };
  }, [
    activateTrackInPlayer,
    fallbackToFirstPlayable,
    loadTrackById,
    queueForTrack,
    selectedTrack,
    selectedTrackId,
    selectionSource,
    visibleTracks,
  ]);

  useEffect(() => {
    if (selectionSource || seededTrackRef.current) {
      return;
    }

    const latestRecentId = recentTrackIds[0] ?? null;
    const firstVisibleTrackId = visibleTracks[0]?.id ?? null;
    const seedTrackId = latestRecentId || firstVisibleTrackId;

    if (!seedTrackId) {
      return;
    }

    const dedupeKey = buildRecentSeedKey(latestRecentId, firstVisibleTrackId);
    if (resolvedRecentTrackRef.current === dedupeKey) {
      return;
    }
    resolvedRecentTrackRef.current = dedupeKey;

    let isActive = true;

    void (async () => {
      let track: Track | null = null;

      if (latestRecentId) {
        track = await resolveRecentSeedTrackWithCache({
          latestRecentId,
          visibleTracks,
          loadTrackById,
        });
      } else {
        track = firstPlayableTrack(visibleTracks);
      }

      if (!isActive || !track || !isPlayable(track)) {
        return;
      }

      activateTrackInPlayer(track, false, "initial", queueForTrack(track));
    })();

    return () => {
      isActive = false;
    };
  }, [
    activateTrackInPlayer,
    queueForTrack,
    recentTrackIds,
    seededTrackRef,
    selectionSource,
    visibleTracks,
    loadTrackById,
  ]);
};
