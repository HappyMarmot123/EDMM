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
  isError?: boolean;
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

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getTrackKey = (_: number, track: Track) => track.id;
const PRIORITY_ARTWORK_COUNT = 8;
const TRACK_ARTWORK_THUMBNAIL_TRANSFORM =
  "c_fill,w_96,h_96,q_auto,f_auto";

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

export function MusicTrackList({
  tracks,
  selectedTrackId,
  currentTrackId,
  isCurrentTrackPlaying = false,
  isLoading = false,
  isError = false,
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
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const [shouldLoadArtwork, setShouldLoadArtwork] = useState(false);
  const scrollTopButtonPresence = useFadePresence(!isScrolledToTop, 200);

  useEffect(() => {
    if (shouldLoadArtwork) {
      return undefined;
    }

    const loadArtwork = () => {
      setShouldLoadArtwork(true);
    };

    const interactionEvents = [
      "keydown",
      "pointerdown",
      "touchstart",
      "wheel",
    ] as const;
    const timeoutHandle = window.setTimeout(loadArtwork, 8000);

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, loadArtwork, {
        once: true,
        passive: true,
      });
    });

    return () => {
      window.clearTimeout(timeoutHandle);
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, loadArtwork);
      });
    };
  }, [shouldLoadArtwork]);

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
      const escapedTrackId = scrollToTrackId.replace(/"/g, '\\"');
      const selectedRow = (() => {
        const currentScroller = scrollerRef.current;

        if (!currentScroller) {
          return null;
        }

        if (currentScroller instanceof Window) {
          return currentScroller.document.querySelector<HTMLElement>(
            `[data-track-row-id="${escapedTrackId}"]`,
          );
        }

        return currentScroller.querySelector<HTMLElement>(
          `[data-track-row-id="${escapedTrackId}"]`,
        );
      })();

      if (selectedRow) {
        selectedRow.focus({ preventScroll: true });
      }

      onTrackZoneScrollHandled?.();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [onTrackZoneScrollHandled, scrollToTrackId, scrollToTrackRequest, tracks]);

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

  const handleScrollToTop = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 0,
      align: "start",
      behavior: "smooth",
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div
          role="status"
          aria-live="polite"
          className="space-y-2 text-sm text-white/62"
        >
          <span>Loading tracks...</span>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[68px] animate-pulse rounded-md border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-[#ff98a2]/30 bg-[#ff98a2]/10 p-5">
        <h2 className="text-lg font-black text-white">Catalog unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          The music catalog did not respond. Try loading it again.
        </p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div
        role="status"
        className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-8 text-center"
      >
        <p className="text-sm font-bold text-white/64">{emptyMessage}</p>
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
          scrollerRef={(ref) => {
            scrollerRef.current = ref;
          }}
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
            const isCurrentTrack = track.id === currentTrackId;
            const isTrackPlayable = isPlayable(track);
            const isCurrentTrackActive = isCurrentTrack && isCurrentTrackPlaying;
            const selectActionLabel =
              playOnSelect && isTrackPlayable ? "Select and play" : "Select";
            const hasArtwork = Boolean(track.artworkUrl);
            const shouldShowArtwork =
              hasArtwork && (index < PRIORITY_ARTWORK_COUNT || shouldLoadArtwork);
            const artworkSrc = shouldShowArtwork
              ? getTrackArtworkSrc(track.artworkUrl)
              : "";

            const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onPlay(track);
            };

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
                    <span
                      aria-hidden="true"
                      data-track-artwork-id={track.id}
                      className="grid aspect-square place-items-center overflow-hidden rounded-md border border-white/10 bg-[#16080f] bg-cover bg-center text-[#ffb8c0]"
                      style={
                        artworkSrc
                          ? { backgroundImage: `url(${artworkSrc})` }
                          : undefined
                      }
                    >
                      {shouldShowArtwork ? (
                        <span className="h-full w-full bg-black/10" />
                      ) : hasArtwork ? (
                        <span
                          className="h-6 w-6 animate-pulse rounded-full bg-[#ff98a2]/20 shadow-[0_0_18px_rgba(255,152,162,0.16)]"
                          data-track-artwork-skeleton
                        />
                      ) : (
                        <Disc3 size={21} strokeWidth={1.8} />
                      )}
                    </span>
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
                    <button
                      type="button"
                      aria-label={`${
                        isCurrentTrackActive ? "Pause" : "Play"
                      } ${track.title}`}
                      onClick={handlePlay}
                      onKeyDown={(event) => event.stopPropagation()}
                      disabled={!isTrackPlayable}
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[#ff98a2] text-black md:h-10 md:w-10"
                    >
                      {isCurrentTrackActive ? (
                        <Pause size={16} fill="currentColor" strokeWidth={2.1} />
                      ) : (
                        <Play size={16} fill="currentColor" strokeWidth={2.1} />
                      )}
                    </button>
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
            onClick={handleScrollToTop}
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
