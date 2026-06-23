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
      className="pl-40 flex flex-col justify-center items-center gap-1 h-full flex-grow overflow-hidden pr-4"
    >
      <section
        className="flex flex-col w-full overflow-hidden"
        aria-label="Track Information"
      >
        <div
          id="track-name"
          className="text-slate-700 text-sm font-bold w-full transition-colors duration-300 overflow-hidden whitespace-nowrap text-ellipsis"
          title={currentTrackInfo?.name}
        >
          {currentTrackInfo?.name}
        </div>
        <div
          id="producer-name"
          className="text-slate-500 text-xs w-full transition-colors duration-300 overflow-hidden whitespace-nowrap text-ellipsis"
          title={currentTrackInfo?.producer}
        >
          {currentTrackInfo?.producer}
        </div>
      </section>
      <section className="flex items-center justify-between w-full">
        <PlayerControlButton
          id="play-previous"
          onClick={prevTrack}
          aria-label="Previous track"
        >
          <SkipBack
            className="block m-auto transition-colors duration-200 ease-[ease] text-[#fd6d94]"
            width={20}
            fill="#fd6d94"
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
          className="w-10 h-10 bg-pink-100 rounded-full hover:bg-pink-200 transition-colors duration-200"
        />
        <PlayerControlButton
          id="play-next"
          onClick={nextTrack}
          aria-label="Next track"
        >
          <SkipForward
            className="block m-auto transition-colors duration-200 ease-[ease] text-[#fd6d94]"
            width={20}
            fill="#fd6d94"
            aria-hidden="true"
          />
        </PlayerControlButton>
        <div className="flex items-center gap-2 justify-end">
          <IconToggleButton
            id="volume-control"
            condition={isMuted}
            IconOnTrue={VolumeX}
            IconOnFalse={Volume2}
            onClick={toggleMute}
            label={muteLabel}
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
            className="no-drag w-full max-w-[100px] h-1.5 bg-[#ffe8ee] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fd6d94] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#fd6d94] [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Volume"
          />
        </div>
      </section>
    </div>
  );
};

export default PlayerControlsSection;
