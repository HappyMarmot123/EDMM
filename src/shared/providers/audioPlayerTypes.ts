import type { Track } from "@/entities/track";
import type { AudioCapabilities } from "@/shared/lib/audioInstance";
import type { PlaybackErrorCode } from "./audioPlaybackErrors";

export type PlaybackError = PlaybackErrorCode | null;

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  isShuffleEnabled: boolean;
  playbackError: PlaybackError;
  setTrack: (track: Track, playImmediately?: boolean) => void;
  playTrack: (
    track: Track,
    queue?: Track[],
    playImmediately?: boolean,
  ) => Promise<void>;
  toggleShuffle: () => void;
  togglePlayPause: () => void | Promise<void>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsBuffering: (buffering: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
}

export interface AudioInstanceState {
  audioInstance: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  audioAnalyser: AnalyserNode | null;
  audioCapabilities: AudioCapabilities;
  cleanAudioInstance: () => void;
}

export interface AudioPlayerLogicReturnType
  extends AudioPlayerState,
    AudioInstanceState {
  handleSelectTrack: (assetId: string) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setLiveVolume: (volume: number) => void;
}
