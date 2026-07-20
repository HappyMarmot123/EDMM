"use client";

import { useMemo } from "react";
import type { SyncedLyricLine, SyncedLyricsDocument } from "@/shared/lib/lyrics";
import { findActiveLyricIndex } from "../model/findActiveLyricIndex";

export type LyricsQueryState =
  | "loading"
  | "unavailable"
  | "error"
  | "success";

export type FullscreenLyricsPanelProps = {
  queryState: LyricsQueryState;
  document: SyncedLyricsDocument | null | undefined;
  currentTimeSeconds: number;
  className?: string;
};

const EMPTY_LINES: readonly SyncedLyricLine[] = [];
const VISIBLE_LINE_COUNT = 5;
const STATE_COPY = {
  loading: "Loading synchronized lyrics…",
  unavailable: "Synced lyrics aren’t available for this track.",
  error: "Lyrics couldn’t be loaded. Playback is still available.",
} as const;

const panelClassName =
  "relative h-[min(34rem,56dvh)] w-full max-w-[34rem] shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/35 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl";

const StateMessage = ({ children }: { children: string }) => (
  <div className="flex h-full items-center justify-center px-6 text-center">
    <p className="max-w-sm text-base font-semibold leading-relaxed text-white/75">
      {children}
    </p>
  </div>
);

const findWindowAnchorIndex = (
  lines: readonly SyncedLyricLine[],
  currentTimeMs: number,
  activeIndex: number,
) => {
  if (lines.length === 0) return -1;
  if (activeIndex >= 0) return activeIndex;
  if (!Number.isFinite(currentTimeMs)) return 0;

  let low = 0;
  let high = lines.length;

  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (lines[middle].startMs <= currentTimeMs) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return Math.min(low, lines.length - 1);
};

export default function FullscreenLyricsPanel({
  queryState,
  document: lyricsDocument,
  currentTimeSeconds,
  className = "",
}: FullscreenLyricsPanelProps) {
  const lines =
    queryState === "success" &&
    lyricsDocument &&
    !lyricsDocument.instrumental
      ? lyricsDocument.lines
      : EMPTY_LINES;
  const currentTimeMs = currentTimeSeconds * 1_000;
  const activeIndex = findActiveLyricIndex(lines, currentTimeMs);
  const windowAnchorIndex = findWindowAnchorIndex(
    lines,
    currentTimeMs,
    activeIndex,
  );
  const visibleLines = useMemo(() => {
    if (windowAnchorIndex < 0) return [];

    const halfWindow = Math.floor(VISIBLE_LINE_COUNT / 2);
    const maxStartIndex = Math.max(0, lines.length - VISIBLE_LINE_COUNT);
    const startIndex = Math.min(
      Math.max(0, windowAnchorIndex - halfWindow),
      maxStartIndex,
    );

    return lines
      .slice(startIndex, startIndex + VISIBLE_LINE_COUNT)
      .map((line, offset) => ({ line, index: startIndex + offset }));
  }, [lines, windowAnchorIndex]);

  let content;
  if (queryState === "loading") {
    content = <StateMessage>{STATE_COPY.loading}</StateMessage>;
  } else if (queryState === "unavailable") {
    content = <StateMessage>{STATE_COPY.unavailable}</StateMessage>;
  } else if (queryState === "error" || !lyricsDocument) {
    content = <StateMessage>{STATE_COPY.error}</StateMessage>;
  } else if (lyricsDocument.instrumental) {
    content = <StateMessage>Instrumental track</StateMessage>;
  } else if (lyricsDocument.lines.length === 0) {
    content = <StateMessage>{STATE_COPY.unavailable}</StateMessage>;
  } else {
    content = (
      <div
        data-testid="lyrics-line-window"
        className="flex h-full touch-none items-center overflow-hidden overscroll-none px-3 sm:px-5"
      >
        <div className="flex w-full flex-col gap-2">
          {visibleLines.map(({ line, index }) => {
            const isActive = index === activeIndex;

            return (
              <p
                key={`${line.startMs}:${index}`}
                data-testid="lyric-line"
                aria-current={isActive ? "true" : undefined}
                className={`flex min-h-11 w-full items-center rounded-xl px-4 py-3 text-left text-lg font-bold leading-snug transition-colors duration-200 ${
                  isActive
                    ? "bg-white/12 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.9)]"
                    : "text-white/65"
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Synchronized lyrics"
      className={`${panelClassName} ${className}`.trim()}
    >
      {content}
    </section>
  );
}
