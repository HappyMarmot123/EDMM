import React, { useEffect } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { PlayerControlsSectionProps } from "@/shared/types/dataType";
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useVolumeControl } from "@/shared/hooks/useVolumeControl";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import { IconToggleButton } from "@/shared/components/iconToggleButton";

const PlayerControlsSection: React.FC<
  Omit<PlayerControlsSectionProps, "isMobile">
> = ({ currentTrackInfo }) => {
  const {
    isPlaying,
    volume,
    isMuted,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    setLiveVolume,
    toggleMute,
  } = useAudioPlayer();

  const { localVolume, handleVolumeChange, handleVolumeChangeEnd } =
    useVolumeControl(volume, setVolume, setLiveVolume, isMuted, toggleMute);

  const playPauseLabel = isPlaying ? "Pause" : "Play";
  const muteLabel = isMuted ? "Unmute" : "Mute";
  const hasTrack = Boolean(currentTrackInfo);

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
    <div
      id="player-controls"
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(130px,1fr)]"
    >
      <section
        className="min-w-0 overflow-hidden"
        aria-label="Track Information"
      >
        <div
          id="track-name"
          className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
          title={currentTrackInfo?.name}
        >
          {currentTrackInfo?.name ?? "No track selected"}
        </div>
        <div
          id="producer-name"
          className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/55"
          title={currentTrackInfo?.producer}
        >
          {currentTrackInfo?.producer ?? "Choose a song to start playback"}
        </div>
      </section>
      <section
        className="flex items-center justify-center gap-2"
        aria-label="Playback controls"
      >
        <PlayerControlButton
          id="play-previous"
          onClick={prevTrack}
          aria-label="Previous track"
          className="h-10 w-10 text-white/70 hover:text-white"
          disabled={!hasTrack}
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
          className="h-11 w-11 bg-white text-black hover:bg-[#ffd6e1]"
          disabled={!hasTrack}
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
          disabled={!hasTrack}
        >
          <SkipForward
            className="m-auto block transition-colors duration-200 ease-out"
            width={20}
            fill="currentColor"
            aria-hidden="true"
          />
        </PlayerControlButton>
      </section>
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
          className="w-full max-w-[112px] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#fd6d94] h-1.5 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#fd6d94] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fd6d94]"
          aria-label="Volume"
        />
      </section>
    </div>
  );
};

export default PlayerControlsSection;
