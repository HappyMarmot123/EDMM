"use client";

import { memo } from "react";
import type { Track } from "@/entities/track/model";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { Play, Pause } from "lucide-react";
import { IconToggleButton } from "@/shared/components/iconToggleButton";

interface MPlayerControlsSectionProps {
  currentTrackInfo: Track | null;
}

const MPlayerControlsSection = ({
  currentTrackInfo,
}: MPlayerControlsSectionProps) => {
  const { isPlaying, togglePlayPause } = useAudioPlayer();
  const playPauseLabel = isPlaying ? "Pause" : "Play";
  const hasPlayableTrack = Boolean(currentTrackInfo?.streamUrl);

  return (
    <section
      id="player-controls-mobile"
      className="flex flex-none items-center justify-end"
      aria-label={`${currentTrackInfo?.title ?? "Current track"} controls`}
    >
      <IconToggleButton
        id="play-pause-mobile"
        condition={isPlaying}
        IconOnTrue={Pause}
        IconOnFalse={Play}
        onClick={togglePlayPause}
        label={playPauseLabel}
        className="h-11 w-11 text-white hover:bg-white/10"
        disabled={!hasPlayableTrack}
        iconProps={{
          width: 26,
          height: 26,
          fill: "currentColor",
          className: "text-current",
        }}
      />
    </section>
  );
};

export default memo(MPlayerControlsSection);
