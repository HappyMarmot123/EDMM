import React from "react";
import type { Track } from "@/entities/track";
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
import { PlayerControlButton } from "@/shared/components/playerControlBtn";
import { IconToggleButton } from "@/shared/components/iconToggleButton";
import VolumeBar from "@/features/audio/components/volumeBar";

interface PlayerControlsSectionProps {
  currentTrackInfo: Track | null;
  onFullscreenOpen?: () => void;
  canOpenFullscreen?: boolean;
  isFullscreenOpen?: boolean;
}

const MIN_UNMUTE_VOLUME = 0.1;
const CONTROL_ICON_CLASS_NAME = "m-auto block transition-colors duration-200 ease-out";
const TRACK_NAV_BUTTON_CLASS_NAME = "h-10 w-10 text-white/70 hover:text-white";

export const PlayerVolumeControls: React.FC = () => {
  const { volume, isMuted, setVolume, setLiveVolume, toggleMute } =
    useAudioPlayer();
  const muteLabel = isMuted ? "Unmute" : "Mute";

  const handleToggleMute = () => {
    // 볼륨이 0(또는 최소치 미만)인 채 unmute하면 무음이 되므로 최소 볼륨으로 복원.
    // setVolume(v > 0)이 provider에서 isMuted를 자동 해제하므로 toggleMute는 생략.
    if (isMuted && volume < MIN_UNMUTE_VOLUME) {
      setLiveVolume(MIN_UNMUTE_VOLUME);
      setVolume(MIN_UNMUTE_VOLUME);
      return;
    }
    toggleMute();
  };

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
        onClick={handleToggleMute}
        label={muteLabel}
        title={muteLabel}
        pressFeedback
        blurOnPointerClick
        className="h-9 w-9 text-white/70 hover:text-white"
        iconProps={{
          width: 20,
          height: 20,
          fill: "none",
          strokeWidth: 2.2,
          className: "text-current",
        }}
      />
      <VolumeBar
        volume={volume}
        isMuted={isMuted}
        setVolume={setVolume}
        setLiveVolume={setLiveVolume}
        toggleMute={toggleMute}
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
            pressFeedback
            blurOnPointerClick
            className={`relative h-9 w-9 ${
              isShuffleEnabled
                ? "text-[#fd6d94] hover:text-[#ff9ab5]"
                : "text-white/60 hover:text-white"
            }`}
            disabled={!hasPlayableTrack}
          >
            <Shuffle
              className={CONTROL_ICON_CLASS_NAME}
              width={17}
              fill="currentColor"
              aria-hidden="true"
            />
            {isShuffleEnabled ? (
              <span
                data-testid="shuffle-active-dot"
                aria-hidden="true"
                className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#fd6d94]"
              />
            ) : null}
          </PlayerControlButton>

          <PlayerControlButton
            id="play-previous"
            onClick={prevTrack}
            aria-label="Previous track"
            title="Previous track"
            pressFeedback
            blurOnPointerClick
            className={TRACK_NAV_BUTTON_CLASS_NAME}
            disabled={!hasPlayableQueue}
          >
            <SkipBack
              className={CONTROL_ICON_CLASS_NAME}
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
            title={playPauseLabel}
            hoverSurface={false}
            pressFeedback
            blurOnPointerClick
            className="bg-white text-black hover:scale-105"
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
            title="Next track"
            pressFeedback
            blurOnPointerClick
            className={TRACK_NAV_BUTTON_CLASS_NAME}
            disabled={!hasPlayableQueue}
          >
            <SkipForward
              className={CONTROL_ICON_CLASS_NAME}
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
              pressFeedback
              blurOnPointerClick
              className="ml-auto grid h-9 w-9 text-white/60 hover:text-white"
            >
              <FullscreenIcon
                className={CONTROL_ICON_CLASS_NAME}
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
