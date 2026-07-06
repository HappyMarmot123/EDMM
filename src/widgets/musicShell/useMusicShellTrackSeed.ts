import { useCallback, useEffect, useRef } from "react";
import type { Track } from "@/entities/track";
import { isPlayable } from "@/entities/track";
import { getCachedTrack } from "@/shared/db";
import {
  buildRecentSeedKey,
  buildVisibleTrackFingerprint,
  firstPlayableTrack,
} from "./trackSeedUtils";
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
  isInitialSeedPaused?: boolean;
  isAutomaticSeedDisabled?: boolean;
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
  isInitialSeedPaused = false,
  isAutomaticSeedDisabled = false,
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
    if (isInitialSeedPaused || selectionSource !== "initial" || !selectedTrackId) {
      return;
    }

    const selectedTrackFingerprint = selectedTrack
      ? buildVisibleTrackFingerprint(selectedTrack)
      : `${selectedTrackId}|visible:${visibleTracks.length > 0 ? "ready" : "waiting"}`;

    if (resolvedInitialTrackRef.current === selectedTrackFingerprint) {
      return;
    }

    resolvedInitialTrackRef.current = selectedTrackFingerprint;
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
        if (visibleTracks.length === 0 && !selectedTrack) {
          return;
        }

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
    isInitialSeedPaused,
    loadTrackById,
    queueForTrack,
    selectedTrack,
    selectedTrackId,
    selectionSource,
    visibleTracks,
  ]);

  useEffect(() => {
    if (isInitialSeedPaused || isAutomaticSeedDisabled || selectionSource) {
      return;
    }

    const latestRecentId = recentTrackIds[0] ?? null;
    const firstVisibleTrackId = visibleTracks[0]?.id ?? null;
    const firstVisibleTrack = visibleTracks[0] ?? null;
    const seedTrackId = latestRecentId || firstVisibleTrackId;

    if (!seedTrackId) {
      return;
    }

    const visibleTrackFingerprint = buildVisibleTrackFingerprint(firstVisibleTrack);
    const dedupeKey = `${buildRecentSeedKey(latestRecentId, firstVisibleTrackId)}:${visibleTrackFingerprint}`;
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
    isAutomaticSeedDisabled,
    isInitialSeedPaused,
    queueForTrack,
    recentTrackIds,
    selectionSource,
    visibleTracks,
    loadTrackById,
  ]);
};
