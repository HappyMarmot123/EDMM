import type { Session, User, UserMetadata } from "@supabase/supabase-js";
import { Method } from "axios";
import { LucideProps } from "lucide-react";
import type { RefObject, ReactNode } from "react";

// 타입 제네릭 추상화 이그젬플
// 임플리먼트 말고 익스텐즈로 상속 후 확장 구현

export interface FavoriteBase<T> {
  favoriteAssetIds: Set<string>;
  toggleFavorite: T;
}

export interface FavoriteState
  extends FavoriteBase<(assetId: string, userId: string) => Promise<void>> {
  setFavorites: (favorites: Set<string>) => void;
}

export interface ModalMusicListProps
  extends FavoriteBase<(assetId: string) => void> {
  isLoading: boolean;
  trackList: CloudinaryResourceMap;
  handleSelectTrack: (assetId: string) => void;
}

export interface BaseResponse {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface BaseObject {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface BaseTrack {
  artists: ArtistObjectSimplified[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

export interface PagingObject<T> extends BaseResponse {
  items: T[];
}

export interface SearchResponse {
  tracks: PagingObject<TrackObjectFull>;
}

export interface ExternalUrls {
  spotify: string;
}

export interface ImageObject {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ArtistObjectSimplified extends BaseObject {
  name: string;
  type: "artist";
}

export interface AlbumObjectSimplified extends BaseObject {
  album_type: "album" | "single" | "compilation";
  total_tracks: number;
  available_markets: string[];
  images: ImageObject[];
  name: string;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  type: "album";
  artists: ArtistObjectSimplified[];
}

export interface TrackObjectFull extends BaseTrack {
  album: AlbumObjectSimplified;
  available_markets: string[];
  external_ids: { isrc?: string; ean?: string; upc?: string };
  is_playable?: boolean;
  popularity: number;
}

export interface AlbumTrackItem extends BaseTrack {
  is_playable: boolean;
}

export interface AlbumTracks extends BaseResponse {
  items: AlbumTrackItem[];
}

export interface Copyright {
  text: string;
  type: string;
}

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
}

export interface AlbumArtworkProps {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrackInfo: TrackInfo | null;
}

export interface PlayerControlsSectionProps {
  currentTrackInfo: TrackInfo | null;
}

export interface ExtendedAlbumArtworkProps extends AlbumArtworkProps {
  onClick?: () => void;
}

export interface CloudinaryResource {
  asset_id: string;
  created_at: string;
  status: string;
  public_id: string;
  type: string;
  resource_type: string;
  asset_folder: string;
  secure_url: string;
  context: {
    alt: string;
    caption: string;
  };
  title: string;
  producer: string;
  album_secure_url: string;
}

export interface CloudinaryResourceMap
  extends Map<string, CloudinaryResource> {}

export interface CustomUserMetadata extends UserMetadata {
  uid: string;
  avatar_url: string;
  email: string;
  full_name: string;
}

export interface AuthStrategy {
  signIn(options?: any): Promise<void>;
}

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: Record<string, any>;
  isLoadingSession: boolean;
  setSession: (session: Session | null) => void;
  authActions: {
    isLoading: boolean;
    signIn: (strategy: AuthStrategy) => Promise<void>;
    signOut: () => Promise<void>;
    GoogleAuthStrategy: AuthStrategy;
    KakaoAuthStrategy: AuthStrategy;
  };
};

export type AuthProviderProps = {
  children: ReactNode;
};

export interface AudioPlayerState {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;

  setTrack: (track: TrackInfo, playImmediately?: boolean) => void;
  togglePlayPause: () => void;
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

export interface AudioStoreActions {
  storeSetCurrentTime: (time: number) => void;
  storeSetDuration: (duration: number) => void;
  storeSetIsBuffering: (isBuffering: boolean) => void;
  setTrack: (track: TrackInfo, playImmediately?: boolean) => void;
}

export interface CloudinaryStoreState {
  cloudinaryData: CloudinaryResourceMap;
  cloudinaryError: Error | null;
  isLoadingCloudinary: boolean;
  setCloudinaryData: (data: CloudinaryResourceMap) => void;
  setCloudinaryError: (error: Error | null) => void;
}

export interface RecentPlayState {
  recentAssetIds: Set<string>;
  addRecentAssetId: (assetId: string) => void;
}

export interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
}

export interface EarthProps {
  width?: number;
  height?: number;
  className?: string;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
}

export interface IconToggleButtonProps {
  id: string;
  condition: boolean;
  IconOnTrue: React.ComponentType<LucideProps>;
  IconOnFalse: React.ComponentType<LucideProps>;
  onClick: () => void;
  label: string;
  iconProps?: Omit<LucideProps, "ref">;
}

export interface LikeButtonProps {
  track: CloudinaryResource | TrackInfo;
  role: Record<string, any>;
  isFavorite: boolean;
  toggleFavorite: (assetId: string) => void;
}

export interface UnifiedTrack {
  id: string;
  name: string;
  album: string;
  artworkUrl: string;
  producer: string;
  url: string;
  metadata: Record<string, unknown>;
}

export interface TabButtonProps {
  activeButton: string;
  setActiveButton: (type: string) => void;
  user: User | null;
}

export interface TabButtonMethod {
  isDisabled(user: User | null): boolean;
  wrapWithTooltip(button: React.ReactNode, user: User | null): React.ReactNode;
  render(props: TabButtonProps): React.ReactElement;
}

export interface ButtonConfig {
  type: "heart" | "available";
  Icon: React.ElementType;
  text: string;
  activeColorClasses: string;
  inactiveColorClasses: string;
  isDisabled(user: User | null): boolean;
  wrapWithTooltip?(button: React.ReactNode, user: User | null): React.ReactNode;
}

export interface ErrorProps {
  error: Error;
  reset: () => void;
}

export interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity?: number;
}

export interface TabButtonFactoryProps {
  type: "heart" | "available";
  props: TabButtonProps;
}

export interface HorizontalSwiperProps {
  data: CloudinaryResource[];
  swiperId: string;
}

export interface MyTooltipProps {
  children: React.ReactNode;
  tooltipText: string;
  showTooltip?: boolean;
  delayDuration?: number;
  sideOffset?: number;
}

export interface OnclickEffectProps {
  play: boolean;
  onComplete: () => void;
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

export interface HttpClientRequestConfig<T> {
  url: string;
  method: Method;
  payload?: any;
  params?: any;
  headers?: Record<string, string>;
}

export interface HttpClientResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export type TogglePlayPauseLogicParams = {
  audioContext: AudioContext | null;
  storeTogglePlayPause: () => void;
};

export type SeekLogicParams = {
  audio: HTMLAudioElement | null;
  currentTrack: TrackInfo | null;
  duration: number | null;
  time: number;
  storeSeekTo: (time: number) => void;
  isSeekingRef: React.MutableRefObject<boolean>;
};

export type PlayTrackLogicParams<T extends TrackInfo = TrackInfo> = {
  cloudinaryData: CloudinaryResourceMap;
  currentTrack: T | null;
  setTrack: (track: T, playImmediately: boolean) => void;
  isPlaying: boolean;
};

export type PlayNextTrackLogicParams = PlayTrackLogicParams;
export type PlayPrevTrackLogicParams = PlayTrackLogicParams;

export interface zustandPersistSet {
  (
    partial:
      | AudioPlayerState
      | Partial<AudioPlayerState>
      | ((
          state: AudioPlayerState
        ) => AudioPlayerState | Partial<AudioPlayerState>),
    replace?: false
  ): void;
  (
    state: AudioPlayerState | ((state: AudioPlayerState) => AudioPlayerState),
    replace: true
  ): void;
  (arg0: any): any;
}

export interface AudioPlayerLogicReturnType
  extends AudioPlayerState,
    CloudinaryStoreState,
    AudioInstanceState {
  handleSelectTrack: ModalMusicListProps["handleSelectTrack"];
  togglePlayPause: AudioPlayerState["togglePlayPause"];
  setVolume: AudioPlayerState["setVolume"];
  toggleMute: AudioPlayerState["toggleMute"];
  nextTrack: any;
  prevTrack: any;
  seek: any;
  setLiveVolume: any;
}

export interface CardContextValue {
  children?: React.ReactNode;
  card: CloudinaryResource;
  handleClickCard: (e: React.MouseEvent<HTMLElement>) => void;
  handleClickButton: (
    e: React.MouseEvent<HTMLButtonElement>,
    track: CloudinaryResource
  ) => void;
}
