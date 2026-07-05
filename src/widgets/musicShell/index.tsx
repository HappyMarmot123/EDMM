"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPlayable, type Track } from "@/entities/track";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useRecentPlays } from "@/features/library";
import { getCachedTracks } from "@/shared/db";
import { addEdmmEventListener, EDMM_EVENTS } from "@/shared/lib/edmmEvents";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import SearchBackdrop from "./searchBackdrop";
import TrackDetailAside from "./trackDetailAside";
import { resolveCatalogFallbackState } from "./catalogFallbackState";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildTrackSeedFingerprint,
  dedupeIds,
  findTrackById,
  firstPlayableTrack,
} from "./trackSeedUtils";
import {
  SelectionSource,
  useMusicShellTrackSeed,
} from "./useMusicShellTrackSeed";

export interface MusicShellProps {
  onPlay?: (track: Track, queue?: Track[], playImmediately?: boolean) => void;
  initialView?: MusicView;
  initialTrackId?: string | null;
}

type CachedTrackState = {
  tracks: Track[];
  isLoading: boolean;
};
const noop: NonNullable<MusicShellProps["onPlay"]> = () => {};
const TRACK_SELECT_PLAYBACK_MEDIA_QUERY = "(max-width: 767px)";

const isMusicView = (view: MusicView | undefined): view is MusicView =>
  view === "all" || view === "recent";

function useTrackSelectPlaybackMode() {
  return useMediaQuery(TRACK_SELECT_PLAYBACK_MEDIA_QUERY, false);
}

function useCachedTrackList(ids: string[]): CachedTrackState {
  const [state, setState] = useState<CachedTrackState>({
    tracks: [],
    isLoading: false,
  });

  useEffect(() => {
    let isActive = true;

    if (ids.length === 0) {
      setState({ tracks: [], isLoading: false });
      return;
    }

    setState((current) => ({ ...current, isLoading: true }));
    getCachedTracks(ids)
      .then((tracks) => {
        if (isActive) {
          setState({ tracks, isLoading: false });
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ tracks: [], isLoading: false });
        }
      });

    return () => {
      isActive = false;
    };
  }, [ids]);

  return state;
}

export function MusicShell({
  onPlay = noop,
  initialView,
  initialTrackId = null,
}: MusicShellProps) {
  const normalizedInitialView = isMusicView(initialView) ? initialView : "all";
  const isMobileView = useTrackSelectPlaybackMode();
  const normalizedInitialTrackId = initialTrackId?.trim().length
    ? initialTrackId
    : null;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<MusicView>(
    isMobileView ? "all" : normalizedInitialView,
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    normalizedInitialTrackId,
  );
  const [selectionSource, setSelectionSource] =
    useState<SelectionSource | null>(
      normalizedInitialTrackId ? "initial" : null,
    );
  const [playerZoneScrollRequest, setPlayerZoneScrollRequest] = useState<{
    trackId: string;
    requestId: number;
  } | null>(null);
  const [isTrackDetailOpen, setIsTrackDetailOpen] = useState(true);
  const { currentTrack, isPlaying } = useAudioPlayer();
  const currentTrackId = currentTrack?.id ?? null;
  const appliedInitialTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId,
  );
  const ignoredInitialCurrentTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId ? currentTrackId : null,
  );
  const isCurrentTrackPlaying = Boolean(currentTrackId && isPlaying);
  const shouldPlayOnTrackSelect = isMobileView;
  const activeView = useMemo<MusicView>(() => {
    return isMobileView ? "all" : view;
  }, [isMobileView, view]);

  const handleTrackZoneScrollHandled = useCallback(
    () => setPlayerZoneScrollRequest(null),
    [],
  );

  const handleViewChange = useCallback(
    (nextView: MusicView) => {
      if (isMobileView) {
        return;
      }

      setView(nextView);
    },
    [isMobileView],
  );

  const seededTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    setView(isMobileView ? "all" : normalizedInitialView);
  }, [isMobileView, normalizedInitialView]);

  useEffect(() => {
    const cleanup = addEdmmEventListener(
      window,
      EDMM_EVENTS.playerTrackZoneSelect,
      (event) => {
        const trackId = event.detail.trackId.trim();
        if (!trackId) {
          return;
        }

        setSelectedTrackId(trackId);
        setSelectionSource("visible");
        setPlayerZoneScrollRequest((current) => ({
          trackId,
          requestId: current?.trackId === trackId ? current.requestId + 1 : 1,
        }));
      },
    );

    return cleanup;
  }, []);

  const normalizedQuery = query.trim();
  const {
    data: cloudinaryData,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch,
  } = useCloudinaryTracks(normalizedQuery, { resourceType: "all" });
  const [lastSuccessfulCatalogTracks, setLastSuccessfulCatalogTracks] =
    useState<Track[]>([]);
  const catalogTracks = useMemo(() => cloudinaryData ?? [], [cloudinaryData]);

  const { recentIds } = useRecentPlays();

  const allRecentTrackIds = useMemo(() => dedupeIds(recentIds), [recentIds]);
  const recentTrackIds = useMemo(
    () => (isMobileView ? [] : allRecentTrackIds),
    [allRecentTrackIds, isMobileView],
  );
  const recentState = useCachedTrackList(recentTrackIds);

  useEffect(() => {
    if (isCatalogError || isCatalogLoading || catalogTracks.length === 0) {
      return;
    }

    setLastSuccessfulCatalogTracks((currentTracks) => {
      if (
        currentTracks.length === catalogTracks.length &&
        currentTracks.every(
          (track, index) => track.id === catalogTracks[index]?.id,
        )
      ) {
        return currentTracks;
      }

      return catalogTracks;
    });
  }, [catalogTracks, isCatalogError, isCatalogLoading]);

  const catalogFallbackState = useMemo(
    () =>
      resolveCatalogFallbackState({
        activeView,
        currentTracks:
          activeView === "recent" ? recentState.tracks : catalogTracks,
        previousCatalogTracks: lastSuccessfulCatalogTracks,
        isCatalogLoading,
        isCatalogError,
        hasSearchQuery: normalizedQuery.length > 0,
        recentUnavailable: false,
      }),
    [
      activeView,
      recentState.tracks,
      catalogTracks,
      lastSuccessfulCatalogTracks,
      isCatalogLoading,
      isCatalogError,
      normalizedQuery,
    ],
  );

  const visibleTracks = useMemo(() => {
    if (catalogFallbackState.visibleTracks.length > 0) {
      return catalogFallbackState.visibleTracks;
    }

    return activeView === "recent" ? recentState.tracks : catalogTracks;
  }, [
    activeView,
    catalogFallbackState.visibleTracks,
    recentState.tracks,
    catalogTracks,
  ]);

  const visibleTrackIds = useMemo(
    () => new Set(visibleTracks.map((track) => track.id)),
    [visibleTracks],
  );

  useEffect(() => {
    if (
      normalizedInitialTrackId &&
      appliedInitialTrackIdRef.current !== normalizedInitialTrackId
    ) {
      appliedInitialTrackIdRef.current = normalizedInitialTrackId;
      ignoredInitialCurrentTrackIdRef.current = currentTrackId;
      setSelectedTrackId(normalizedInitialTrackId);
      setSelectionSource("initial");
      return;
    }

    if (currentTrackId) {
      const shouldKeepInitialSelection =
        Boolean(normalizedInitialTrackId) &&
        appliedInitialTrackIdRef.current === normalizedInitialTrackId &&
        selectedTrackId === normalizedInitialTrackId &&
        selectionSource === "initial" &&
        ignoredInitialCurrentTrackIdRef.current === currentTrackId &&
        currentTrackId !== normalizedInitialTrackId;

      if (shouldKeepInitialSelection) {
        return;
      }

      const nextSelectionSource =
        selectionSource === "initial" && selectedTrackId === currentTrackId
          ? "initial"
          : visibleTrackIds.has(currentTrackId)
            ? "visible"
            : "initial";

      setSelectedTrackId((previousId) =>
        previousId === currentTrackId ? previousId : currentTrackId,
      );
      setSelectionSource(nextSelectionSource);
      return;
    }

    if (normalizedInitialTrackId) {
      return;
    }

    appliedInitialTrackIdRef.current = null;
    ignoredInitialCurrentTrackIdRef.current = null;

    if (selectedTrackId) {
      return;
    }

    setSelectedTrackId(null);
    setSelectionSource(null);
  }, [
    currentTrackId,
    normalizedInitialTrackId,
    selectedTrackId,
    selectionSource,
    visibleTrackIds,
  ]);

  useEffect(() => {
    if (!currentTrackId || selectionSource === "initial") {
      return;
    }

    if (!visibleTrackIds.has(currentTrackId)) {
      setSelectedTrackId(null);
      setSelectionSource(null);
    }
  }, [currentTrackId, selectionSource, visibleTrackIds]);

  useEffect(() => {
    if (!selectedTrackId || selectionSource !== "visible") {
      return;
    }

    if (!visibleTrackIds.has(selectedTrackId)) {
      setSelectedTrackId(null);
      setSelectionSource(null);
    }
  }, [selectedTrackId, selectionSource, visibleTrackIds]);

  const selectedTrack = useMemo(() => {
    if (!selectedTrackId) return null;

    return findTrackById(visibleTracks, selectedTrackId);
  }, [selectedTrackId, visibleTracks]);
  const visibleSelectedTrackId = selectedTrack?.id ?? null;
  const detailSelectedTrackId =
    selectionSource === "initial"
      ? selectedTrackId
      : (visibleSelectedTrackId ?? selectedTrackId);

  const queueForTrack = useCallback(
    (track: Track) => {
      const trackIsVisible = visibleTracks.some(
        (visibleTrack) => visibleTrack.id === track.id,
      );

      return trackIsVisible ? visibleTracks : [track];
    },
    [visibleTracks],
  );

  const activateTrackInPlayer = useCallback(
    (
      track: Track,
      playImmediately = false,
      source: SelectionSource = "visible",
      queueOverride?: Track[],
    ) => {
      const queue = queueOverride ?? queueForTrack(track);
      const seedFingerprint = buildTrackSeedFingerprint(track, queue);
      if (!playImmediately && seededTrackIdRef.current === seedFingerprint) {
        return;
      }

      seededTrackIdRef.current = seedFingerprint;
      onPlay(track, queue, playImmediately);
      setSelectedTrackId(track.id);
      setSelectionSource(source);
    },
    [onPlay, queueForTrack],
  );

  const handleSelect = (track: Track) => {
    if (shouldPlayOnTrackSelect && isPlayable(track)) {
      activateTrackInPlayer(track, true, "visible", queueForTrack(track));
      return;
    }

    setSelectedTrackId(track.id);
    setSelectionSource("visible");
  };

  const handlePlay = (track: Track) => {
    setSelectedTrackId(track.id);
    setSelectionSource("visible");
    activateTrackInPlayer(track, true, "visible", queueForTrack(track));
  };

  const fallbackToFirstPlayable = useCallback(() => {
    const fallbackTrack = firstPlayableTrack(visibleTracks);

    if (!fallbackTrack) {
      setSelectedTrackId(null);
      setSelectionSource(null);
      return;
    }

    activateTrackInPlayer(
      fallbackTrack,
      false,
      "initial",
      queueForTrack(fallbackTrack),
    );
  }, [activateTrackInPlayer, queueForTrack, visibleTracks]);

  useMusicShellTrackSeed({
    selectionSource,
    selectedTrackId,
    selectedTrack,
    visibleTracks,
    recentTrackIds,
    queueForTrack,
    activateTrackInPlayer,
    fallbackToFirstPlayable,
  });

  const isVisibleLoading =
    activeView === "all"
      ? catalogFallbackState.status === "loading_initial"
      : recentState.isLoading;
  const isVisibleError =
    activeView === "all"
      ? catalogFallbackState.status === "catalog_error_empty"
      : false;
  const emptyMessage = catalogFallbackState.emptyMessage;
  return (
    <main className="app-viewport-height relative flex flex-col overflow-hidden bg-[#050306] px-4 pb-[calc(84px+max(env(safe-area-inset-bottom),10px))] pt-5 text-white sm:px-6 sm:pb-[calc(84px+max(env(safe-area-inset-bottom),12px))] md:pb-[calc(112px+max(env(safe-area-inset-bottom),12px))] lg:px-8">
      <SearchBackdrop />
      <section
        className={`music-shell-grid relative mx-auto grid min-h-0 w-full flex-1 gap-5 max-w-6xl ${
          isTrackDetailOpen
            ? "music-shell-grid--aside-open"
            : "music-shell-grid--aside-closed"
        }`}
      >
        <main className="min-w-0 flex min-h-0 flex-1 flex-col gap-5">
          <MusicShellHeader
            query={query}
            view={activeView}
            resultCount={catalogTracks.length}
            recentCount={allRecentTrackIds.length}
            onQueryChange={setQuery}
            onViewChange={handleViewChange}
          />

          <section
            aria-label="Track list section"
            className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/24 p-0 md:p-4"
          >
            <MusicTrackList
              tracks={visibleTracks}
              selectedTrackId={visibleSelectedTrackId}
              currentTrackId={currentTrackId}
              isCurrentTrackPlaying={isCurrentTrackPlaying}
              isLoading={isVisibleLoading}
              isError={isVisibleError}
              emptyMessage={emptyMessage}
              fallbackNotice={catalogFallbackState.notice}
              playOnSelect={shouldPlayOnTrackSelect}
              onSelect={handleSelect}
              onPlay={handlePlay}
              scrollToTrackId={playerZoneScrollRequest?.trackId ?? null}
              scrollToTrackRequest={playerZoneScrollRequest?.requestId}
              onTrackZoneScrollHandled={handleTrackZoneScrollHandled}
              onRetry={
                activeView === "all" ? () => void refetch?.() : undefined
              }
            />
          </section>
        </main>

        <section className="music-shell-aside-shell hidden md:block">
          <button
            type="button"
            onClick={() => setIsTrackDetailOpen((value) => !value)}
            aria-label={
              isTrackDetailOpen ? "Close track detail" : "Open track detail"
            }
            className="music-shell-aside__toggle rounded-full border border-white/15 bg-[#ff98a2] px-2.5 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#0b0609]"
          >
            {isTrackDetailOpen ? (
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>

          <aside
            aria-label="Track detail aside"
            className={`min-w-0 h-full pb-0 ${
              isTrackDetailOpen
                ? "music-shell-aside music-shell-aside--open"
                : "music-shell-aside music-shell-aside--closed"
            }`}
          >
            <div className="music-shell-aside__content">
              <TrackDetailAside
                selectedTrackId={detailSelectedTrackId}
                fallbackTrack={selectedTrack}
                isWaitingForSelectionSeed={
                  selectionSource === "initial" &&
                  !selectedTrack &&
                  isVisibleLoading
                }
              />
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

export default MusicShell;
