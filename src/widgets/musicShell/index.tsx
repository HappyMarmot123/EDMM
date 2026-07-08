"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPlayable, type Track } from "@/entities/track";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import type { CloudinaryTrackCategory } from "@/shared/api/cloudinary/cloudinaryCategory";
import { useRecentPlays } from "@/features/library";
import { getCachedTracksResult } from "@/shared/db";
import { addEdmmEventListener, EDMM_EVENTS } from "@/shared/lib/edmmEvents";
import { captureSearchFallbackEvent } from "@/shared/lib/sentry/searchFallbackEvents";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import MusicShellHeader from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import SearchBackdrop from "./searchBackdrop";
import TrackDetailAside from "./trackDetailAside";
import {
  type CatalogFallbackNotice,
  resolveCatalogFallbackState,
} from "./catalogFallbackState";
import { ChevronLeft, ChevronRight, ListMusic, RefreshCw } from "lucide-react";
import {
  buildTrackSeedFingerprint,
  dedupeIds,
  findTrackById,
  firstPlayableTrack,
  shouldClearVisibleSelection,
} from "./trackSeedUtils";
import {
  SelectionSource,
  useMusicShellTrackSeed,
} from "./useMusicShellTrackSeed";
import { isMusicView, type MusicView } from "./musicView";

export interface MusicShellProps {
  onPlay?: (track: Track, queue?: Track[], playImmediately?: boolean) => void;
  initialView?: MusicView;
  initialTrackId?: string | null;
}

type CachedTrackState = {
  tracks: Track[];
  isLoading: boolean;
  isUnavailable: boolean;
};
const noop: NonNullable<MusicShellProps["onPlay"]> = () => {};
const SEARCH_QUERY_DEBOUNCE_MS = 400;
const TRACK_SELECT_PLAYBACK_MEDIA_QUERY = "(max-width: 767px)";

function useDebouncedSearchQuery(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    if (!query) {
      setDebouncedQuery("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_QUERY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return debouncedQuery;
}

type CatalogMusicView = Extract<MusicView, "pop" | "edm">;

const resolveTrackCatalogView = (
  trackId: string | null,
  popTracks: Track[] | undefined,
  edmTracks: Track[] | undefined,
): CatalogMusicView | null => {
  if (!trackId) {
    return null;
  }

  if (popTracks?.some((track) => track.id === trackId)) {
    return "pop";
  }

  if (edmTracks?.some((track) => track.id === trackId)) {
    return "edm";
  }

  return null;
};

const hasCatalogLookupSettled = (
  tracks: Track[] | undefined,
  isFetched: boolean | undefined,
  isError: boolean | undefined,
) => tracks !== undefined || Boolean(isFetched) || Boolean(isError);

type CatalogFallbackFeedbackProps = {
  notice: CatalogFallbackNotice | null;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

function CatalogFallbackFeedback({
  notice,
  onPrimaryAction,
  onSecondaryAction,
}: CatalogFallbackFeedbackProps) {
  if (!notice) {
    return null;
  }

  const isError = notice.tone === "error";

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(96px+max(env(safe-area-inset-bottom),16px))] z-40 flex justify-center md:bottom-[calc(126px+max(env(safe-area-inset-bottom),18px))] md:justify-end md:pr-8">
      <section
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        data-testid="music-shell-fallback-feedback"
        className={[
          "pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl",
          isError
            ? "border-[#ff98a2]/45 bg-[#210910]/92 text-white"
            : "border-white/14 bg-[#0b080d]/92 text-white",
        ].join(" ")}
      >
        <h2 className="text-sm font-black text-white">{notice.title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/64">
          {notice.description}
        </p>
        {notice.primaryActionLabel || notice.secondaryActionLabel ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {notice.primaryActionLabel && onPrimaryAction ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#ff98a2]/48 px-3 text-xs font-black text-[#ffb8c0] transition-colors hover:border-[#ff98a2]/78 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
              >
                <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{notice.primaryActionLabel}</span>
              </button>
            ) : null}
            {notice.secondaryActionLabel && onSecondaryAction ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/16 px-3 text-xs font-black text-white/78 transition-colors hover:border-white/32 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                <ListMusic size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{notice.secondaryActionLabel}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function useTrackSelectPlaybackMode() {
  return useMediaQuery(TRACK_SELECT_PLAYBACK_MEDIA_QUERY, false);
}

function useCachedTrackList(ids: string[]): CachedTrackState {
  const [state, setState] = useState<CachedTrackState>({
    tracks: [],
    isLoading: false,
    isUnavailable: false,
  });

  useEffect(() => {
    let isActive = true;

    if (ids.length === 0) {
      setState({ tracks: [], isLoading: false, isUnavailable: false });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, isUnavailable: false }));
    getCachedTracksResult(ids)
      .then((result) => {
        if (isActive) {
          setState({
            tracks: result.tracks,
            isLoading: false,
            isUnavailable: result.unavailable,
          });
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ tracks: [], isLoading: false, isUnavailable: true });
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
  const normalizedInitialView = isMusicView(initialView) ? initialView : "pop";
  const hasExplicitInitialView = isMusicView(initialView);
  const isMobileView = useTrackSelectPlaybackMode();
  const normalizedInitialTrackId = initialTrackId?.trim().length
    ? initialTrackId
    : null;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<MusicView>(normalizedInitialView);
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
  const [pendingPlayerZoneTrackId, setPendingPlayerZoneTrackId] = useState<
    string | null
  >(null);
  const [isTrackDetailOpen, setIsTrackDetailOpen] = useState(true);
  const { currentTrack, isPlaying } = useAudioPlayer();
  const currentTrackId = currentTrack?.id ?? null;
  const appliedInitialTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId,
  );
  const ignoredInitialCurrentTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId ? currentTrackId : null,
  );
  const reportedFallbackKeysRef = useRef<Set<string>>(new Set());
  const isCurrentTrackPlaying = Boolean(currentTrackId && isPlaying);
  const shouldPlayOnTrackSelect = isMobileView;
  const activeView = view;
  const manualViewChangeRef = useRef(false);

  const requestPlayerZoneScroll = useCallback((trackId: string) => {
    setPlayerZoneScrollRequest((current) => ({
      trackId,
      requestId: current?.trackId === trackId ? current.requestId + 1 : 1,
    }));
  }, []);

  const handleTrackZoneScrollHandled = useCallback(
    () => setPlayerZoneScrollRequest(null),
    [],
  );

  const handleViewChange = useCallback((nextView: MusicView) => {
    manualViewChangeRef.current = true;
    setView(nextView);
  }, []);

  const seededTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    setView(normalizedInitialView);
  }, [normalizedInitialView]);

  const normalizedQuery = query.trim();
  const appliedSearchQuery = useDebouncedSearchQuery(normalizedQuery);
  const catalogCategory: CloudinaryTrackCategory =
    activeView === "edm" ? "edm" : "pop";
  // 두 폴더의 전체 트랙 수를 미리 받아 탭 배지에 노출한다(검색어와 무관한 총 개수).
  const {
    data: popCatalogData,
    isFetched: isPopCatalogFetched,
    isError: isPopCatalogError,
  } = useCloudinaryTracks("", {
    resourceType: "all",
    category: "pop",
  });
  const {
    data: edmCatalogData,
    isFetched: isEdmCatalogFetched,
    isError: isEdmCatalogError,
  } = useCloudinaryTracks("", {
    resourceType: "all",
    category: "edm",
  });
  const catalogCounts = useMemo(
    () => ({
      pop: popCatalogData?.length ?? 0,
      edm: edmCatalogData?.length ?? 0,
    }),
    [popCatalogData, edmCatalogData],
  );
  const {
    data: cloudinaryData,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch,
  } = useCloudinaryTracks(appliedSearchQuery, {
    resourceType: "all",
    category: catalogCategory,
  });
  const handleCatalogRetry = useCallback(() => {
    void refetch?.();
  }, [refetch]);
  const [lastSuccessfulCatalogTracks, setLastSuccessfulCatalogTracks] =
    useState<Track[]>([]);
  const catalogTracks = useMemo(() => cloudinaryData ?? [], [cloudinaryData]);

  const { recentIds, isUnavailable: isRecentPlaysUnavailable } = useRecentPlays();

  const allRecentTrackIds = useMemo(() => dedupeIds(recentIds), [recentIds]);
  const recentTrackIds = allRecentTrackIds;
  const recentState = useCachedTrackList(recentTrackIds);
  const initialSeedTrackId =
    normalizedInitialTrackId ?? recentTrackIds[0] ?? null;
  const initialSeedCatalogView = useMemo(
    () =>
      resolveTrackCatalogView(
        initialSeedTrackId,
        popCatalogData,
        edmCatalogData,
      ),
    [edmCatalogData, initialSeedTrackId, popCatalogData],
  );
  const areInitialSeedCatalogsSettled =
    hasCatalogLookupSettled(
      popCatalogData,
      isPopCatalogFetched,
      isPopCatalogError,
    ) &&
    hasCatalogLookupSettled(
      edmCatalogData,
      isEdmCatalogFetched,
      isEdmCatalogError,
    );
  const shouldAlignInitialView =
    !hasExplicitInitialView &&
    !manualViewChangeRef.current &&
    Boolean(initialSeedTrackId) &&
    initialSeedCatalogView !== null &&
    activeView !== initialSeedCatalogView;
  const isInitialSeedPaused =
    !hasExplicitInitialView &&
    !manualViewChangeRef.current &&
    Boolean(initialSeedTrackId) &&
    (!areInitialSeedCatalogsSettled || shouldAlignInitialView);

  useEffect(() => {
    if (
      hasExplicitInitialView ||
      manualViewChangeRef.current ||
      !initialSeedTrackId ||
      !areInitialSeedCatalogsSettled ||
      !initialSeedCatalogView ||
      activeView === initialSeedCatalogView
    ) {
      return;
    }

    setView(initialSeedCatalogView);
  }, [
    activeView,
    areInitialSeedCatalogsSettled,
    hasExplicitInitialView,
    initialSeedCatalogView,
    initialSeedTrackId,
  ]);

  useEffect(() => {
    if (isCatalogError || isCatalogLoading) {
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
        hasSearchQuery: appliedSearchQuery.length > 0,
        recentUnavailable: Boolean(
          isRecentPlaysUnavailable || recentState.isUnavailable,
        ),
      }),
    [
      activeView,
      isRecentPlaysUnavailable,
      recentState.tracks,
      recentState.isUnavailable,
      catalogTracks,
      lastSuccessfulCatalogTracks,
      isCatalogLoading,
      isCatalogError,
      appliedSearchQuery,
    ],
  );

  useEffect(() => {
    if (
      catalogFallbackState.status !== "catalog_error_empty" &&
      catalogFallbackState.status !== "catalog_error_with_stale_data"
    ) {
      return;
    }

    const eventKey = [
      "catalog_fetch_failed",
      activeView,
      appliedSearchQuery.length,
      catalogFallbackState.isShowingStaleData ? "stale" : "empty",
    ].join(":");
    if (reportedFallbackKeysRef.current.has(eventKey)) {
      return;
    }

    reportedFallbackKeysRef.current.add(eventKey);
    captureSearchFallbackEvent({
      type: "catalog_fetch_failed",
      route: "/search",
      view: activeView,
      queryLength: appliedSearchQuery.length,
      hasQuery: appliedSearchQuery.length > 0,
      hasStaleData: catalogFallbackState.isShowingStaleData,
    });
  }, [
    activeView,
    catalogFallbackState.isShowingStaleData,
    catalogFallbackState.status,
    appliedSearchQuery.length,
  ]);

  useEffect(() => {
    if (
      catalogFallbackState.status !== "recent_unavailable" ||
      !isRecentPlaysUnavailable
    ) {
      return;
    }

    const eventKey = `indexeddb_unavailable:${activeView}:recent_plays_read`;
    if (reportedFallbackKeysRef.current.has(eventKey)) {
      return;
    }

    reportedFallbackKeysRef.current.add(eventKey);
    captureSearchFallbackEvent({
      type: "indexeddb_unavailable",
      route: "/search",
      view: activeView,
      operation: "recent_plays_read",
    });
  }, [activeView, catalogFallbackState.status, isRecentPlaysUnavailable]);

  useEffect(() => {
    if (
      catalogFallbackState.status !== "recent_unavailable" ||
      !recentState.isUnavailable
    ) {
      return;
    }

    const eventKey = `indexeddb_unavailable:${activeView}:track_cache_bulk_read`;
    if (reportedFallbackKeysRef.current.has(eventKey)) {
      return;
    }

    reportedFallbackKeysRef.current.add(eventKey);
    captureSearchFallbackEvent({
      type: "indexeddb_unavailable",
      route: "/search",
      view: activeView,
      operation: "track_cache_bulk_read",
    });
  }, [activeView, catalogFallbackState.status, recentState.isUnavailable]);

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

  const handlePlayerTrackZoneSelect = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setSelectionSource("visible");

      const targetView = resolveTrackCatalogView(
        trackId,
        popCatalogData,
        edmCatalogData,
      );

      if (targetView && activeView !== targetView) {
        manualViewChangeRef.current = true;
        setPendingPlayerZoneTrackId(trackId);
        setView(targetView);
        return;
      }

      if (!targetView && !areInitialSeedCatalogsSettled) {
        setPendingPlayerZoneTrackId(trackId);
        return;
      }

      setPendingPlayerZoneTrackId(null);
      requestPlayerZoneScroll(trackId);
    },
    [
      activeView,
      areInitialSeedCatalogsSettled,
      edmCatalogData,
      popCatalogData,
      requestPlayerZoneScroll,
    ],
  );

  useEffect(() => {
    const cleanup = addEdmmEventListener(
      window,
      EDMM_EVENTS.playerTrackZoneSelect,
      (event) => {
        const trackId = event.detail.trackId.trim();
        if (!trackId) {
          return;
        }

        handlePlayerTrackZoneSelect(trackId);
      },
    );

    return cleanup;
  }, [handlePlayerTrackZoneSelect]);

  useEffect(() => {
    if (!pendingPlayerZoneTrackId) {
      return;
    }

    const targetView = resolveTrackCatalogView(
      pendingPlayerZoneTrackId,
      popCatalogData,
      edmCatalogData,
    );

    if (targetView && activeView !== targetView) {
      manualViewChangeRef.current = true;
      setView(targetView);
      return;
    }

    if (visibleTrackIds.has(pendingPlayerZoneTrackId)) {
      requestPlayerZoneScroll(pendingPlayerZoneTrackId);
      setPendingPlayerZoneTrackId(null);
      return;
    }

    if (targetView === activeView && !isCatalogLoading) {
      requestPlayerZoneScroll(pendingPlayerZoneTrackId);
      setPendingPlayerZoneTrackId(null);
      return;
    }

    if (!targetView && areInitialSeedCatalogsSettled) {
      requestPlayerZoneScroll(pendingPlayerZoneTrackId);
      setPendingPlayerZoneTrackId(null);
    }
  }, [
    activeView,
    areInitialSeedCatalogsSettled,
    edmCatalogData,
    isCatalogLoading,
    pendingPlayerZoneTrackId,
    popCatalogData,
    requestPlayerZoneScroll,
    visibleTrackIds,
  ]);

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

      const isCurrentTrackSelected = selectedTrackId === currentTrackId;
      const nextSelectionSource =
        isCurrentTrackSelected && selectionSource === "initial"
          ? "initial"
          : "visible";

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
  ]);

  useEffect(() => {
    if (
      shouldClearVisibleSelection({
        selectedTrackId,
        currentTrackId,
        selectionSource,
        visibleTrackIds,
      })
    ) {
      setSelectedTrackId(null);
      setSelectionSource(null);
    }
  }, [currentTrackId, selectedTrackId, selectionSource, visibleTrackIds]);

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

  const handleSelect = useCallback(
    (track: Track) => {
      if (shouldPlayOnTrackSelect && isPlayable(track)) {
        activateTrackInPlayer(track, true, "visible", queueForTrack(track));
        return;
      }

      setSelectedTrackId(track.id);
      setSelectionSource("visible");
    },
    [activateTrackInPlayer, isPlayable, queueForTrack, shouldPlayOnTrackSelect],
  );

  const handlePlay = useCallback(
    (track: Track) => {
      setSelectedTrackId(track.id);
      setSelectionSource("visible");
      activateTrackInPlayer(track, true, "visible", queueForTrack(track));
    },
    [activateTrackInPlayer, queueForTrack],
  );

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
    isInitialSeedPaused,
    isAutomaticSeedDisabled: manualViewChangeRef.current,
  });

  const isVisibleLoading =
    activeView === "recent"
      ? recentState.isLoading
      : catalogFallbackState.status === "loading_initial";
  const emptyMessage = catalogFallbackState.emptyMessage;
  const fallbackNoticePrimaryAction =
    activeView === "recent" ? undefined : handleCatalogRetry;
  const fallbackNoticeSecondaryAction =
    activeView === "recent" ? () => handleViewChange("pop") : undefined;
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
            catalogCounts={catalogCounts}
            showCatalogCounts={!isMobileView}
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
              emptyMessage={emptyMessage}
              canClearSearch={catalogFallbackState.status === "search_empty"}
              onClearSearch={() => setQuery("")}
              playOnSelect={shouldPlayOnTrackSelect}
              onSelect={handleSelect}
              onPlay={handlePlay}
              scrollToTrackId={playerZoneScrollRequest?.trackId ?? null}
              scrollToTrackRequest={playerZoneScrollRequest?.requestId}
              onTrackZoneScrollHandled={handleTrackZoneScrollHandled}
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
                activeView={activeView}
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
      <CatalogFallbackFeedback
        notice={catalogFallbackState.notice}
        onPrimaryAction={fallbackNoticePrimaryAction}
        onSecondaryAction={fallbackNoticeSecondaryAction}
      />
    </main>
  );
}

export default MusicShell;
