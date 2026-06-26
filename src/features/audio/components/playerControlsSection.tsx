import React, { useEffect, useState } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { PlayerControlsSectionProps } from "@/shared/types/dataType";
import {
  Pause,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useVolumeControl } from "@/shared/hooks/useVolumeControl";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import { IconToggleButton } from "@/shared/components/iconToggleButton";

export const PlayerVolumeControls: React.FC = () => {
  const { volume, isMuted, setVolume, setLiveVolume, toggleMute } =
    useAudioPlayer();
  const { localVolume, handleVolumeChange, handleVolumeChangeEnd } =
    useVolumeControl(volume, setVolume, setLiveVolume, isMuted, toggleMute);
  const muteLabel = isMuted ? "Unmute" : "Mute";

  return (
    <section
      className="hidden min-w-0 items-center justify-end gap-2 md:flex"
      aria-label="Volume controls"
    >
      <IconToggleButton
        id="volume-control"
        condition={isMuted}
        IconOnTrue={VolumeX}
        IconOnFalse={Volume2}
        onClick={toggleMute}
        label={muteLabel}
        className="h-9 w-9 text-white/70 hover:text-white"
        iconProps={{
          width: 20,
          height: 20,
          fill: "none",
          strokeWidth: 2.2,
          className: "text-current",
        }}
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : localVolume}
        onChange={handleVolumeChange}
        onMouseUp={handleVolumeChangeEnd}
        onTouchEnd={handleVolumeChangeEnd}
        className="h-1.5 w-full max-w-[112px] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#fd6d94] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#fd6d94] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fd6d94]"
        aria-label="Volume"
      />
    </section>
  );
};

const PlayerControlsSection: React.FC<
  Omit<PlayerControlsSectionProps, "isMobile">
> = ({ currentTrackInfo }) => {
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);

  const {
    isPlaying,
    volume,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    setLiveVolume,
  } = useAudioPlayer();

  const playPauseLabel = isPlaying ? "Pause" : "Play";
  const hasPlayableTrack = Boolean(currentTrackInfo?.url);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          if (!hasPlayableTrack) {
            return;
          }

          event.preventDefault();
          togglePlayPause();
          break;
        case "ArrowUp":
          event.preventDefault();
          {
            const newVolume = Math.min(volume + 0.05, 1);
            setVolume(newVolume);
            setLiveVolume(newVolume);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          {
            const newVolume = Math.max(volume - 0.05, 0);
            setVolume(newVolume);
            setLiveVolume(newVolume);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlayPause, volume, setVolume, setLiveVolume]);

  return (
    <section
      id="player-controls"
      className="flex w-full flex-col items-center gap-2"
      aria-label={`${currentTrackInfo?.name ?? "Current track"} controls`}
    >
      <div className="flex w-full items-center justify-center gap-2">
        <PlayerControlButton
          id="shuffle"
          onClick={() => setIsShuffleEnabled((value) => !value)}
          aria-label={
            isShuffleEnabled ? "Disable shuffle playback" : "Enable shuffle playback"
          }
          className="h-9 w-9 text-white/60 hover:text-white"
          disabled={!hasPlayableTrack}
        >
          <Shuffle
            className="m-auto block transition-colors duration-200 ease-out"
            width={17}
            fill="currentColor"
            aria-hidden="true"
          />
        </PlayerControlButton>

        <PlayerControlButton
          id="play-previous"
          onClick={prevTrack}
          aria-label="Previous track"
          className="h-10 w-10 text-white/70 hover:text-white"
          disabled={!hasPlayableTrack}
        >
          <SkipBack
            className="m-auto block transition-colors duration-200 ease-out"
            width={20}
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
          className="bg-white text-black hover:bg-[#ffd6e1]"
          disabled={!hasPlayableTrack}
          iconProps={{
            width: 22,
            height: 22,
            fill: "currentColor",
            className: "text-black",
          }}
        />

        <PlayerControlButton
          id="play-next"
          onClick={nextTrack}
          aria-label="Next track"
          className="h-10 w-10 text-white/70 hover:text-white"
          disabled={!hasPlayableTrack}
        >
          <SkipForward
            className="m-auto block transition-colors duration-200 ease-out"
            width={20}
            fill="currentColor"
            aria-hidden="true"
          />
        </PlayerControlButton>

        <PlayerControlButton
          id="repeat"
          onClick={() => setIsRepeatEnabled((value) => !value)}
          aria-label={
            isRepeatEnabled ? "Disable repeat playback" : "Enable repeat playback"
          }
          className={`h-9 w-9 text-white/60 hover:text-white transition-colors ${isRepeatEnabled ? "text-[#ff98a2]" : ""}`}
          disabled={!hasPlayableTrack}
        >
          <Repeat2
            className="m-auto block transition-colors duration-200 ease-out"
            width={17}
            fill="currentColor"
            aria-hidden="true"
          />
        </PlayerControlButton>
      </div>

      <div className="min-h-[14px] text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/50">
        {isShuffleEnabled ? "Shuffle" : "Linear"}
      </div>
    </section>
  );
};

export default PlayerControlsSection;
