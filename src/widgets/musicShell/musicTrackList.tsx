"use client";

import { Disc3, Play } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { type VirtuosoHandle, Virtuoso } from "react-virtuoso";
import type { Track } from "@/entities/Track/model";
import { isPlayable } from "@/entities/Track/model";

type MusicTrackListProps = {
  tracks: Track[];
  selectedTrackId?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  onSelect: (track: Track) => void;
  onPlay: (track: Track) => void;
  onRetry?: () => void;
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

const trackScrollerComponents = {
  Scroller: (
    props: ComponentPropsWithoutRef<"div"> & { stateChanged?: unknown },
  ) => {
    const { stateChanged: _stateChanged, className, ...htmlProps } = props;
    const mergedClassName = `scrollbar-hide ${className ?? ""}`.trim();

    return <div {...htmlProps} className={mergedClassName} />;
  },
};

export function MusicTrackList({
  tracks,
  selectedTrackId,
  isLoading = false,
  isError = false,
  emptyMessage = "No tracks in this view.",
  onSelect,
  onPlay,
  onRetry,
  scrollToTrackId,
  scrollToTrackRequest,
  onTrackZoneScrollHandled,
}: MusicTrackListProps) {
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
    (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, track: Track) => {
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
    return (
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
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-[#ff98a2]/30 bg-[#ff98a2]/10 p-5">
        <h2 className="text-lg font-black text-white">Catalog unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          The music catalog did not respond. Try loading it again.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-10 rounded-full bg-[#ff98a2] px-4 text-sm font-black text-black transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-white/[0.04] p-5 text-sm font-semibold text-white/58">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="music-track-list h-full min-h-0 overflow-hidden"
      aria-label="Track list"
      role="list"
    >
      <Virtuoso
        ref={virtuosoRef}
        scrollerRef={(ref) => {
          scrollerRef.current = ref;
        }}
        data={tracks}
        overscan={6}
        computeItemKey={getTrackKey}
        style={{ height: "100%", width: "100%" }}
        components={trackScrollerComponents}
        fixedItemHeight={84}
        itemContent={(index, track) => {
          const isSelected = selectedTrackId === track.id;
          const isTrackPlayable = isPlayable(track);

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
                  "cursor-pointer grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-2 transition-colors",
                  isSelected
                    ? "border-[#ff98a2]/70 bg-[#ff98a2]/13"
                    : "border-transparent bg-white/[0.035] hover:border-white/10 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <div
                  onPointerDown={(event) => event.preventDefault()}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => handleSelect(event, track)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;

                    handleSelect(event, track);
                  }}
                  className="grid min-w-0 grid-cols-[30px_48px_minmax(0,1fr)] items-center gap-3 rounded p-1.5 text-left"
                >
                  <span className="text-sm font-black text-white/38">{index + 1}</span>
                  <span
                    aria-hidden="true"
                    className="grid aspect-square place-items-center overflow-hidden rounded-md border border-white/10 bg-[#16080f] bg-cover bg-center text-[#ffb8c0]"
                    style={
                      track.artworkUrl
                        ? { backgroundImage: `url(${track.artworkUrl})` }
                        : undefined
                    }
                  >
                    {track.artworkUrl ? (
                      <span className="h-full w-full bg-black/10" />
                    ) : (
                      <Disc3 size={21} strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">
                      {track.title}
                    </span>
                    <span className="block truncate text-xs font-semibold text-white/54">
                      {track.artistName}
                      {track.albumName ? ` / ${track.albumName}` : ""}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pr-1">
                  <span className="hidden min-w-10 text-right text-sm font-bold text-white/42 sm:inline">
                    {formatDuration(track.durationMs)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Play ${track.title}`}
                    onClick={handlePlay}
                    onKeyDown={(event) => event.stopPropagation()}
                    disabled={!isTrackPlayable}
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#ff98a2] text-black"
                  >
                    <Play size={18} fill="currentColor" strokeWidth={2.1} />
                  </button>
                </div>
              </li>
            </div>
          );
        }}
      />
    </div>
  );
}

export default MusicTrackList;
