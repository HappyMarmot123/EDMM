"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPlayable, type Track } from "@/entities/Track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { normalizeArtworkUrl } from "@/shared/lib/trackArtwork";
import MusicShellHeader, { type MusicView } from "./musicShellHeader";
import MusicTrackList from "./musicTrackList";
import TrackDetailAside from "./trackDetailAside";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
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
const TRACK_SELECT_PLAYBACK_MEDIA_QUERY = "(pointer: coarse), (max-width: 1023px)";
const MOBILE_VIEW_OPTIONS: Array<{ value: MusicView; label: string }> = [
  { value: "all", label: "All" },
  { value: "recent", label: "Recent" },
];

const isMusicView = (view: MusicView | undefined): view is MusicView =>
  view === "all" || view === "recent";

function useTrackSelectPlaybackMode() {
  const [shouldPlayOnSelect, setShouldPlayOnSelect] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(TRACK_SELECT_PLAYBACK_MEDIA_QUERY);
    const handleChange = () => setShouldPlayOnSelect(mediaQuery.matches);

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return shouldPlayOnSelect;
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
  const normalizedInitialTrackId =
    initialTrackId?.trim().length ? initialTrackId : null;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<MusicView>(normalizedInitialView);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    normalizedInitialTrackId,
  );
  const [selectionSource, setSelectionSource] = useState<SelectionSource | null>(
    normalizedInitialTrackId ? "initial" : null,
  );
  const [
    playerZoneScrollRequest,
    setPlayerZoneScrollRequest,
  ] = useState<{ trackId: string; requestId: number } | null>(null);
  const [isTrackDetailOpen, setIsTrackDetailOpen] = useState(true);
  const { currentTrack, isPlaying } = useAudioPlayer();
  const currentTrackId = currentTrack?.assetId ?? null;
  const appliedInitialTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId,
  );
  const ignoredInitialCurrentTrackIdRef = useRef<string | null>(
    normalizedInitialTrackId ? currentTrackId : null,
  );
  const isCurrentTrackPlaying = Boolean(currentTrackId && isPlaying);
  const shouldPlayOnTrackSelect = useTrackSelectPlaybackMode();

  const handleTrackZoneScrollHandled = useCallback(
    () => setPlayerZoneScrollRequest(null),
    [],
  );

  const seededTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    setView(normalizedInitialView);
  }, [normalizedInitialView]);

  useEffect(() => {
    const handleTrackZoneSelect = (event: Event) => {
      const trackId = (
        event as CustomEvent<{ trackId?: string }>
      ).detail?.trackId?.trim();
      if (!trackId) {
        return;
      }

      setSelectedTrackId(trackId);
      setSelectionSource("visible");
      setPlayerZoneScrollRequest((current) => ({
        trackId,
        requestId:
          current?.trackId === trackId ? current.requestId + 1 : 1,
      }));
    };

    window.addEventListener(
      "edmm:player-track-zone-select",
      handleTrackZoneSelect,
    );

    return () => {
      window.removeEventListener(
        "edmm:player-track-zone-select",
        handleTrackZoneSelect,
      );
    };
  }, []);

  const normalizedQuery = query.trim();
  const {
    data: cloudinaryData,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch,
  } = useCloudinaryTracks(
    normalizedQuery,
    { resourceType: "all" },
  );
  const catalogTracks = useMemo(() => cloudinaryData ?? [], [cloudinaryData]);

  const { recentIds } = useRecentPlays();

  const recentTrackIds = useMemo(() => dedupeIds(recentIds), [recentIds]);
  const recentState = useCachedTrackList(recentTrackIds);

  const visibleTracks = useMemo(() => {
    if (view === "recent") return recentState.tracks;

    return catalogTracks;
  }, [catalogTracks, recentState.tracks, view]);

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
    selectionSource === "initial" ? selectedTrackId : visibleSelectedTrackId ?? selectedTrackId;

  const queueForTrack = useCallback(
    (track: Track) => {
      const trackIsVisible = visibleTracks.some(
        (visibleTrack) => visibleTrack.id === track.id,
      );

      return trackIsVisible ? visibleTracks : [track];
    },
    [visibleTracks],
  );

  const buildTrackSeedFingerprint = useCallback((track: Track, queue: Track[]) => {
    const queueFingerprint = queue.map((queuedTrack) => queuedTrack.id).join(",");
    return `${track.id}|${normalizeArtworkUrl(track.artworkUrl)}|${queueFingerprint}`;
  }, []);

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
    [buildTrackSeedFingerprint, onPlay, queueForTrack],
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

    activateTrackInPlayer(fallbackTrack, false, "initial", queueForTrack(fallbackTrack));
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
    view === "all"
      ? isCatalogLoading
      : recentState.isLoading;
  const isVisibleError = view === "all" ? isCatalogError : false;
  const emptyMessage =
    view === "all"
      ? normalizedQuery
        ? `No tracks found for "${normalizedQuery}".`
        : "No tracks in this view."
      : "No tracks in this view.";
  return (
    <main
      className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#050306] px-4 pb-[calc(148px+max(env(safe-area-inset-bottom),10px))] pt-5 text-white sm:px-6 sm:pb-[calc(156px+max(env(safe-area-inset-bottom),12px))] md:pb-[calc(96px+max(env(safe-area-inset-bottom),12px))] lg:px-8"
    >
      <section className="music-shell-grid mx-auto grid min-h-0 w-full flex-1 gap-5">
        <main className="min-w-0 flex min-h-0 flex-1 flex-col gap-5">
          <MusicShellHeader
            query={query}
            view={view}
            resultCount={catalogTracks.length}
            recentCount={recentTrackIds.length}
            onQueryChange={setQuery}
            onViewChange={setView}
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
              playOnSelect={shouldPlayOnTrackSelect}
              onSelect={handleSelect}
              onPlay={handlePlay}
              scrollToTrackId={playerZoneScrollRequest?.trackId ?? null}
              scrollToTrackRequest={playerZoneScrollRequest?.requestId}
              onTrackZoneScrollHandled={handleTrackZoneScrollHandled}
              onRetry={view === "all" ? () => void refetch?.() : undefined}
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
                queue={visibleTracks}
                onPlay={handlePlay}
                isWaitingForSelectionSeed={
                  selectionSource === "initial" && !selectedTrack && isVisibleLoading
                }
              />
            </div>
          </aside>
        </section>
      </section>

      <nav
        id="bottom-tab-navigation"
        className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-2 gap-2 border-t border-white/10 bg-[#080609]/96 px-4 pt-2 text-white shadow-[0_-18px_45px_rgba(0,0,0,0.38)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
        aria-label="Bottom tab navigation"
      >
        {MOBILE_VIEW_OPTIONS.map(({ value, label }) => {
          const isActive = view === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setView(value)}
              className={[
                "flex min-h-[52px] items-center justify-center rounded-xl text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ffb8c0]",
                isActive
                  ? "bg-[#ff98a2] text-black shadow-[0_10px_26px_rgba(255,152,162,0.22)]"
                  : "bg-transparent text-white/58 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

export default MusicShell;
