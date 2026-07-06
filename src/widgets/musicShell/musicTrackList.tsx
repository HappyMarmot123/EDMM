"use client";

import { ArrowUp, Disc3, Pause, Play } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type VirtuosoHandle, Virtuoso } from "react-virtuoso";
import type { Track } from "@/entities/track";
import { isPlayable } from "@/entities/track";
import { useFadePresence } from "@/shared/hooks/useFadePresence";

type MusicTrackListProps = {
  tracks: Track[];
  selectedTrackId?: string | null;
  currentTrackId?: string | null;
  isCurrentTrackPlaying?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  canClearSearch?: boolean;
  onClearSearch?: () => void;
  playOnSelect?: boolean;
  onSelect: (track: Track) => void;
  onPlay: (track: Track) => void;
  scrollToTrackId?: string | null;
  scrollToTrackRequest?: number;
  onTrackZoneScrollHandled?: () => void;
};

type EmptyTrackListProps = {
  message: string;
  canClearSearch: boolean;
  onClearSearch?: () => void;
};

type TrackArtworkProps = {
  track: Track;
  shouldShowArtwork: boolean;
};

type PlayPauseButtonProps = {
  track: Track;
  isActive: boolean;
  isPlayable: boolean;
  onPlay: (track: Track) => void;
};

type TrackScrollerInput = {
  tracks: Track[];
  scrollToTrackId?: string | null;
  scrollToTrackRequest?: number;
  onTrackZoneScrollHandled?: () => void;
};

const PRIORITY_ARTWORK_COUNT = 8;
const SKELETON_ROW_COUNT = 4;
const DEFERRED_ARTWORK_LOAD_MS = 8000;
const TRACK_ARTWORK_THUMBNAIL_TRANSFORM =
  "c_fill,w_96,h_96,q_auto,f_auto";
const ARTWORK_LOAD_EVENTS = [
  "keydown",
  "pointerdown",
  "touchstart",
  "wheel",
] as const;

const trackScrollerComponents = {
  Scroller: (
    props: ComponentPropsWithoutRef<"div"> & { stateChanged?: unknown },
  ) => {
    const { stateChanged, className, ...htmlProps } = props;
    const mergedClassName = `scrollbar-hide ${className ?? ""}`.trim();
    void stateChanged;

    return <div {...htmlProps} className={mergedClassName} />;
  },
};

const getTrackKey = (_: number, track: Track) => track.id;

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getTrackArtworkSrc = (artworkUrl: string) => {
  if (!artworkUrl) {
    return "";
  }

  try {
    const url = new URL(artworkUrl);
    const segments = url.pathname.split("/");
    const uploadIndex = segments.findIndex((segment) => segment === "upload");

    if (url.hostname !== "res.cloudinary.com" || uploadIndex < 0) {
      return artworkUrl;
    }

    if (segments[uploadIndex + 1] === TRACK_ARTWORK_THUMBNAIL_TRANSFORM) {
      return artworkUrl;
    }

    segments.splice(uploadIndex + 1, 0, TRACK_ARTWORK_THUMBNAIL_TRANSFORM);
    url.pathname = segments.join("/");

    return url.toString();
  } catch {
    return artworkUrl;
  }
};

const findTrackRow = (
  scroller: HTMLElement | Window | null,
  trackId: string,
) => {
  if (!scroller) {
    return null;
  }

  const escapedTrackId = trackId.replace(/"/g, '\\"');
  const selector = `[data-track-row-id="${escapedTrackId}"]`;

  if (scroller instanceof Window) {
    return scroller.document.querySelector<HTMLElement>(selector);
  }

  return scroller.querySelector<HTMLElement>(selector);
};

function useDeferredArtworkLoad() {
  const [shouldLoadArtwork, setShouldLoadArtwork] = useState(false);

  useEffect(() => {
    if (shouldLoadArtwork) {
      return undefined;
    }

    const loadArtwork = () => {
      setShouldLoadArtwork(true);
    };
    const timeoutHandle = window.setTimeout(
      loadArtwork,
      DEFERRED_ARTWORK_LOAD_MS,
    );

    ARTWORK_LOAD_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, loadArtwork, {
        once: true,
        passive: true,
      });
    });

    return () => {
      window.clearTimeout(timeoutHandle);
      ARTWORK_LOAD_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, loadArtwork);
      });
    };
  }, [shouldLoadArtwork]);

  return shouldLoadArtwork;
}

function useTrackScroller({
  tracks,
  scrollToTrackId,
  scrollToTrackRequest,
  onTrackZoneScrollHandled,
}: TrackScrollerInput) {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    if (!scrollToTrackId || scrollToTrackRequest === undefined) {
      return;
    }

    const targetIndex = tracks.findIndex((track) => track.id === scrollToTrackId);

    if (!virtuosoRef.current || targetIndex < 0) {
      onTrackZoneScrollHandled?.();
      return;
    }

    virtuosoRef.current.scrollToIndex({
      index: targetIndex,
      align: "center",
      behavior: "smooth",
    });

    const rafId = requestAnimationFrame(() => {
      findTrackRow(scrollerRef.current, scrollToTrackId)?.focus({
        preventScroll: true,
      });
      onTrackZoneScrollHandled?.();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [onTrackZoneScrollHandled, scrollToTrackId, scrollToTrackRequest, tracks]);

  const setScrollerRef = useCallback((ref: HTMLElement | Window | null) => {
    scrollerRef.current = ref;
  }, []);

  const scrollToTop = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 0,
      align: "start",
      behavior: "smooth",
    });
  }, []);

  return {
    virtuosoRef,
    setScrollerRef,
    scrollToTop,
  };
}

function LoadingTrackList() {
  return (
    <div className="space-y-2">
      <div role="status" aria-live="polite" className="space-y-2 text-sm text-white/62">
        <span>Loading tracks...</span>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, item) => (
          <div
            key={item}
            className="h-[68px] animate-pulse rounded-md border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyTrackList({
  message,
  canClearSearch,
  onClearSearch,
}: EmptyTrackListProps) {
  return (
    <div
      role="status"
      className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-8 text-center"
    >
      <p className="text-sm font-bold text-white/64">{message}</p>
      {canClearSearch && onClearSearch ? (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-4 rounded-full border border-[#ff98a2]/40 px-4 py-2 text-xs font-black text-[#ffb8c0] transition-colors hover:border-[#ff98a2]/75 hover:text-white"
        >
          검색어 지우기
        </button>
      ) : null}
    </div>
  );
}

function TrackArtwork({ track, shouldShowArtwork }: TrackArtworkProps) {
  const artworkSrc = shouldShowArtwork ? getTrackArtworkSrc(track.artworkUrl) : "";

  return (
    <span
      aria-hidden="true"
      data-track-artwork-id={track.id}
      className="grid aspect-square place-items-center overflow-hidden rounded-md border border-white/10 bg-[#16080f] bg-cover bg-center text-[#ffb8c0]"
      style={artworkSrc ? { backgroundImage: `url(${artworkSrc})` } : undefined}
    >
      {shouldShowArtwork ? (
        <span className="h-full w-full bg-black/10" />
      ) : track.artworkUrl ? (
        <span
          className="h-6 w-6 animate-pulse rounded-full bg-[#ff98a2]/20 shadow-[0_0_18px_rgba(255,152,162,0.16)]"
          data-track-artwork-skeleton
        />
      ) : (
        <Disc3 size={21} strokeWidth={1.8} />
      )}
    </span>
  );
}

function PlayPauseButton({
  track,
  isActive,
  isPlayable,
  onPlay,
}: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${isActive ? "Pause" : "Play"} ${track.title}`}
      onClick={(event) => {
        event.stopPropagation();
        onPlay(track);
      }}
      onKeyDown={(event) => event.stopPropagation()}
      disabled={!isPlayable}
      className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[#ff98a2] text-black disabled:cursor-not-allowed disabled:opacity-45 md:h-10 md:w-10"
    >
      {isActive ? (
        <Pause size={16} fill="currentColor" strokeWidth={2.1} />
      ) : (
        <Play size={16} fill="currentColor" strokeWidth={2.1} />
      )}
    </button>
  );
}

export function MusicTrackList({
  tracks,
  selectedTrackId,
  currentTrackId,
  isCurrentTrackPlaying = false,
  isLoading = false,
  emptyMessage = "No tracks in this view.",
  canClearSearch = false,
  onClearSearch,
  playOnSelect = false,
  onSelect,
  onPlay,
  scrollToTrackId,
  scrollToTrackRequest,
  onTrackZoneScrollHandled,
}: MusicTrackListProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const shouldLoadArtwork = useDeferredArtworkLoad();
  const scrollTopButtonPresence = useFadePresence(!isScrolledToTop, 200);
  const { virtuosoRef, setScrollerRef, scrollToTop } = useTrackScroller({
    tracks,
    scrollToTrackId,
    scrollToTrackRequest,
    onTrackZoneScrollHandled,
  });

  const handleSelect = useCallback(
    (event: MouseEvent<HTMLElement>, track: Track) => {
      event.preventDefault();
      if (
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
      onSelect(track);
    },
    [onSelect],
  );

  if (isLoading) {
    return <LoadingTrackList />;
  }

  if (tracks.length === 0) {
    return (
      <EmptyTrackList
        message={emptyMessage}
        canClearSearch={canClearSearch}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="music-track-list scroll-fade-bottom scroll-fade-bottom--mobile relative min-h-0 flex-1 overflow-hidden"
        data-at-bottom={isScrolledToBottom ? "true" : "false"}
        aria-label="Track list"
        role="list"
      >
        <Virtuoso
          ref={virtuosoRef}
          scrollerRef={setScrollerRef}
          atBottomStateChange={setIsScrolledToBottom}
          atTopStateChange={setIsScrolledToTop}
          data={tracks}
          overscan={6}
          computeItemKey={getTrackKey}
          style={{ height: "100%", width: "100%" }}
          components={trackScrollerComponents}
          fixedItemHeight={84}
          itemContent={(index, track) => {
            const isSelected = selectedTrackId === track.id;
            const isTrackPlayable = isPlayable(track);
            const isCurrentTrackActive =
              track.id === currentTrackId && isCurrentTrackPlaying;
            const selectActionLabel =
              playOnSelect && isTrackPlayable ? "Select and play" : "Select";
            const shouldShowArtwork =
              Boolean(track.artworkUrl) &&
              (index < PRIORITY_ARTWORK_COUNT || shouldLoadArtwork);

            return (
              <div
                className="px-1.5 py-1"
                key={track.id}
                data-track-row-id={track.id}
                tabIndex={-1}
              >
                <li
                  role="listitem"
                  className={[
                    "grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-2 transition-colors",
                    isSelected
                      ? "border-[#ff98a2]/70 bg-[#ff98a2]/13"
                      : "border-transparent bg-white/[0.035] hover:border-white/10 hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    aria-label={`${selectActionLabel} ${track.title}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => handleSelect(event, track)}
                    className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded bg-transparent p-1.5 text-left md:grid-cols-[30px_48px_minmax(0,1fr)]"
                  >
                    <span className="hidden text-sm font-black text-white/38 md:block">
                      {index + 1}
                    </span>
                    <TrackArtwork
                      track={track}
                      shouldShowArtwork={shouldShowArtwork}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white">
                        {track.title}
                      </span>
                      <span className="block truncate text-xs font-semibold text-white/54">
                        {track.artistName || "unknown"}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-2 pr-1">
                    <span className="hidden min-w-10 text-right text-sm font-bold text-white/42 sm:inline">
                      {formatDuration(track.durationMs)}
                    </span>
                    <PlayPauseButton
                      track={track}
                      isActive={isCurrentTrackActive}
                      isPlayable={isTrackPlayable}
                      onPlay={onPlay}
                    />
                  </div>
                </li>
              </div>
            );
          }}
        />
        {scrollTopButtonPresence.mounted ? (
          <button
            type="button"
            className={`cursor-pointer absolute bottom-0 left-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-[#ff98a2]/70 bg-[#080609]/82 text-[#ff98a2] shadow-[0_14px_34px_rgba(0,0,0,0.36)] backdrop-blur transition-[opacity,background-color,color] duration-200 ease-out hover:bg-[#ff98a2]/12 hover:text-[#ffb8c0] md:hidden ${
              scrollTopButtonPresence.visible
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default MusicTrackList;
