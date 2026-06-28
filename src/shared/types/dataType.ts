import type { Track } from "@/entities/Track/model";
import type { Method } from "axios";
import type { LucideProps } from "lucide-react";
import type { ReactNode, RefObject } from "react";

export interface TrackInfo {
  assetId: string;
  album: string;
  name: string;
  artworkId: string;
  url: string;
  producer: string;
}

export interface PlayerTrackDetailsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentProgress: number;
  seekBarContainerRef: RefObject<HTMLDivElement | null>;
  seek: (time: number) => void;
  isMobile?: boolean;
  currentTrackInfo?: TrackInfo | null;
}

export interface AlbumArtworkProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrackInfo: TrackInfo | null;
}

export interface PlayerControlsSectionProps {
  currentTrackInfo: TrackInfo | null;
  isMobile?: boolean;
  onFullscreenOpen?: () => void;
  canOpenFullscreen?: boolean;
}

export type ExtendedAlbumArtworkProps = AlbumArtworkProps & {
  currentTrackInfo: TrackInfo | null;
  isMobile?: boolean;
};

export interface AudioPlayerState {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  isShuffleEnabled: boolean;
  setTrack: (track: TrackInfo, playImmediately?: boolean) => void;
  playTrack: (
    track: Track,
    queue?: Track[],
    playImmediately?: boolean,
  ) => void;
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

export interface IconToggleButtonProps {
  id: string;
  condition: boolean;
  IconOnTrue: React.ComponentType<LucideProps>;
  IconOnFalse: React.ComponentType<LucideProps>;
  onClick: () => void | Promise<void>;
  label: string;
  iconProps?: React.SVGProps<SVGSVGElement>;
  className?: string;
  disabled?: boolean;
}

export interface ErrorProps {
  error: Error;
  reset: () => void;
}

export interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity?: number;
}

export interface MyTooltipProps {
  children: React.ReactNode;
  tooltipText: string;
  showTooltip?: boolean;
  delayDuration?: number;
  sideOffset?: number;
}

export interface TrackSeekBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

export interface UseInfiniteScrollProps {
  onIntersect: () => void;
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface InfiniteScrollContextType {
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  resetInfiniteScroll: () => void;
}

export interface InfiniteScrollProviderProps {
  children: ReactNode;
  onLoadMore?: () => void;
}

export interface ToggleContextType {
  isOpen: boolean;
  openToggle: () => void;
  closeToggle: () => void;
}

export interface HttpClientRequestConfig {
  url: string;
  method: Method;
  payload?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
}

export interface HttpClientResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
