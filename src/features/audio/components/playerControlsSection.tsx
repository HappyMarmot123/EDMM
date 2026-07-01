import React from "react";
import type { Track } from "@/entities/track/model";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import {
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useVolumeControl } from "@/shared/hooks/useVolumeControl";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import { IconToggleButton } from "@/shared/components/iconToggleButton";

interface PlayerControlsSectionProps {
  currentTrackInfo: Track | null;
  onFullscreenOpen?: () => void;
  canOpenFullscreen?: boolean;
  isFullscreenOpen?: boolean;
}

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

const PlayerControlsSection: React.FC<PlayerControlsSectionProps> = ({
  currentTrackInfo,
  onFullscreenOpen,
  canOpenFullscreen = false,
  isFullscreenOpen = false,
}) => {
  const {
    isPlaying,
    isShuffleEnabled,
    toggleShuffle,
    togglePlayPause,
    nextTrack,
    prevTrack,
  } = useAudioPlayer();

  const playPauseLabel = isPlaying ? "Pause" : "Play";
  const hasPlayableTrack = Boolean(currentTrackInfo?.streamUrl);
  const hasPlayableQueue = Boolean(currentTrackInfo?.id);
  const handleFullscreenClick = () => onFullscreenOpen?.();
  const FullscreenIcon = isFullscreenOpen ? Minimize2 : Maximize2;
  const fullscreenLabel = isFullscreenOpen
    ? "Exit fullscreen view"
    : "Toggle fullscreen view";
  const fullscreenTitle = isFullscreenOpen ? "Exit fullscreen" : "Fullscreen view";

  return (
    <section
      id="player-controls"
      className="flex w-full flex-col items-center gap-2"
      aria-label={`${currentTrackInfo?.title ?? "Current track"} controls`}
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
          {canOpenFullscreen ? (
            <PlayerControlButton
              id="fullscreen-toggle"
              onClick={handleFullscreenClick}
              aria-label={fullscreenLabel}
              title={fullscreenTitle}
              className="ml-auto grid h-9 w-9 text-white/60 hover:text-white"
            >
              <FullscreenIcon
                className="m-auto block transition-colors duration-200 ease-out"
                width={18}
                height={18}
                fill="currentColor"
                aria-hidden="true"
              />
            </PlayerControlButton>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PlayerControlsSection;
