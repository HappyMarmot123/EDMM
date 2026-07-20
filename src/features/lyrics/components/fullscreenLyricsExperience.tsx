"use client";

import type { Track } from "@/entities/track";
import FullscreenLyricsPanel, {
  type FullscreenLyricsPanelLayout,
  type LyricsQueryState,
} from "./fullscreenLyricsPanel";
import { useLyrics } from "../hooks/useLyrics";

export type FullscreenLyricsExperienceProps = {
  track: Track;
  currentTimeSeconds: number;
  layout?: FullscreenLyricsPanelLayout;
  className?: string;
};

export default function FullscreenLyricsExperience({
  track,
  currentTimeSeconds,
  layout = "default",
  className,
}: FullscreenLyricsExperienceProps) {
  const lyricsQuery = useLyrics(track, { enabled: true, eligible: true });

  let queryState: LyricsQueryState;
  if (lyricsQuery.isPending) {
    queryState = "loading";
  } else if (lyricsQuery.isError || lyricsQuery.data === undefined) {
    queryState = "error";
  } else if (lyricsQuery.data === null) {
    queryState = "unavailable";
  } else {
    queryState = "success";
  }

  return (
    <FullscreenLyricsPanel
      queryState={queryState}
      document={lyricsQuery.data}
      currentTimeSeconds={currentTimeSeconds}
      layout={layout}
      className={className}
    />
  );
}
