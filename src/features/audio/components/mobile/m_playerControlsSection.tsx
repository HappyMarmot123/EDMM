"use client";

import { memo } from "react";
import { type PlayerControlsSectionProps } from "@/shared/types/dataType";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { IconToggleButton } from "@/shared/components/iconToggleButton";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";

const MPlayerControlsSection = ({
  currentTrackInfo,
}: Pick<PlayerControlsSectionProps, "currentTrackInfo">) => {
  const { isPlaying, togglePlayPause, nextTrack, prevTrack } = useAudioPlayer();
  const playPauseLabel = isPlaying ? "Pause" : "Play";

  return (
    <section className="flex items-center justify-end gap-3">
      <PlayerControlButton
        id="play-previous"
        onClick={prevTrack}
        aria-label="Previous track"
        className="p-1"
      >
        <SkipBack
          className="block m-auto text-slate-600"
          width={22}
          height={22}
          fill="currentColor"
          aria-hidden="true"
        />
      </PlayerControlButton>
      <IconToggleButton
        id="play-pause"
        condition={isPlaying}
        IconOnTrue={Pause}
        IconOnFalse={Play}
        onClick={togglePlayPause}
        label={playPauseLabel}
        className="p-2 w-11 h-11"
        iconProps={{
          width: 28,
          height: 28,
          fill: "currentColor",
          className: "text-slate-600",
        }}
      />
      <PlayerControlButton
        id="play-next"
        onClick={nextTrack}
        aria-label="Next track"
        className="p-1"
      >
        <SkipForward
          className="block m-auto text-slate-600"
          width={22}
          height={22}
          fill="currentColor"
          aria-hidden="true"
        />
      </PlayerControlButton>
    </section>
  );
};

export default memo(MPlayerControlsSection);
