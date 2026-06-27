import React, { useEffect } from "react";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { PlayerControlsSectionProps } from "@/shared/types/dataType";
import {
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
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
      className="min-w-0 items-center justify-end gap-2 flex"
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
        className="h-1.5 w-[112px] min-w-[112px] max-w-[112px] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#fd6d94] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#fd6d94] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fd6d94]"
        aria-label="Volume"
      />
    </section>
  );
};

const PlayerControlsSection: React.FC<
  Omit<PlayerControlsSectionProps, "isMobile">
> = ({ currentTrackInfo }) => {
  const {
    isPlaying,
    volume,
    isShuffleEnabled,
    toggleShuffle,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    setLiveVolume,
  } = useAudioPlayer();

  const playPauseLabel = isPlaying ? "Pause" : "Play";
  const hasPlayableTrack = Boolean(currentTrackInfo?.url);
  const hasPlayableQueue = Boolean(currentTrackInfo?.assetId);
  const handleFullscreenClick = () => {};

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
      <div className="flex w-full justify-center gap-2">
        <div className="flex items-center gap-2">
          <PlayerControlButton
            id="shuffle"
            onClick={toggleShuffle}
            aria-label={
              isShuffleEnabled ? "Disable shuffle playback" : "Enable shuffle playback"
            }
            title={isShuffleEnabled ? "Shuffle on" : "Shuffle off"}
            className={`h-9 w-9 ${
              isShuffleEnabled ? "text-[#fd6d94]" : "text-white/60"
            }`}
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
            disabled={!hasPlayableQueue}
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
            disabled={!hasPlayableQueue}
          >
            <SkipForward
              className="m-auto block transition-colors duration-200 ease-out"
              width={20}
              fill="currentColor"
              aria-hidden="true"
            />
          </PlayerControlButton>
          <PlayerControlButton
            id="fullscreen-toggle"
            onClick={handleFullscreenClick}
            aria-label="Toggle fullscreen view"
            title="Fullscreen view"
            className="ml-auto h-9 w-9 text-white/60 hover:text-white"
          >
            <Maximize2
              className="m-auto block transition-colors duration-200 ease-out"
              width={18}
              height={18}
              fill="currentColor"
              aria-hidden="true"
            />
          </PlayerControlButton>
        </div>
      </div>
    </section>
  );
};

export default PlayerControlsSection;
