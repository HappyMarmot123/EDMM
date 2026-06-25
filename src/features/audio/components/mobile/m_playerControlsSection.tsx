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
  const hasTrack = Boolean(currentTrackInfo);

  return (
    <section
      id="player-controls"
      className="flex flex-none items-center justify-end gap-1"
      aria-label={`${currentTrackInfo?.name ?? "Current track"} controls`}
    >
      <PlayerControlButton
        id="play-previous"
        onClick={prevTrack}
        aria-label="Previous track"
        className="h-10 w-10 text-white/70 hover:text-white"
        disabled={!hasTrack}
      >
        <SkipBack
          className="m-auto block"
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
        className="h-11 w-11 bg-white text-black hover:bg-[#ffd6e1]"
        disabled={!hasTrack}
        iconProps={{
          width: 28,
          height: 28,
          fill: "currentColor",
          className: "text-black",
        }}
      />
      <PlayerControlButton
        id="play-next"
        onClick={nextTrack}
        aria-label="Next track"
        className="h-10 w-10 text-white/70 hover:text-white"
        disabled={!hasTrack}
      >
        <SkipForward
          className="m-auto block"
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
