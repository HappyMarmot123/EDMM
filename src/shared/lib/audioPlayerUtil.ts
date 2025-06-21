import type {
  TrackInfo,
  TogglePlayPauseLogicParams,
  SeekLogicParams,
  PlayNextTrackLogicParams,
  PlayPrevTrackLogicParams,
  CloudinaryResourceMap,
} from "@/shared/types/dataType";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { isEmpty } from "lodash";

export const togglePlayPauseLogic = async ({
  audioContext,
  storeTogglePlayPause,
}: TogglePlayPauseLogicParams) => {
  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }
  storeTogglePlayPause();
};

export const seekLogic = ({
  audio,
  currentTrack,
  duration,
  time,
  storeSeekTo,
  isSeekingRef,
}: SeekLogicParams) => {
  if (!audio || !currentTrack) {
    console.error("Audio or currentTrack is null");
    return;
  }

  isSeekingRef.current = true;
  const newTime = Math.max(0, Math.min(time, duration || 0));
  audio.currentTime = newTime;
  storeSeekTo(newTime);
};

export const playNextTrackLogic = ({
  cloudinaryData,
  currentTrack,
  setTrack,
  isPlaying,
}: PlayNextTrackLogicParams) => {
  if (isEmpty(cloudinaryData)) {
    console.error("Cloudinary data is empty");
    return;
  }

  const trackEntries = Array.from(cloudinaryData.entries());
  const currentIndex = trackEntries.findIndex(
    ([id, value]) => id === currentTrack?.assetId
  );
  const nextTrackEntry = trackEntries[(currentIndex + 1) % trackEntries.length];

  setFindNewTrack(cloudinaryData, nextTrackEntry[0], setTrack, isPlaying);
};

export const playPrevTrackLogic = ({
  cloudinaryData,
  currentTrack,
  setTrack,
  isPlaying,
}: PlayPrevTrackLogicParams) => {
  if (cloudinaryData.size === 0) {
    console.error("Cloudinary data is empty");
    return;
  }

  const trackEntries = Array.from(cloudinaryData.entries());
  const currentIndex = trackEntries.findIndex(
    ([id, value]) => id === currentTrack?.assetId
  );

  if (currentIndex === -1) {
    console.error("Current track not found");
    return;
  }

  const prevIndex =
    (currentIndex - 1 + trackEntries.length) % trackEntries.length;
  const prevTrackData = trackEntries[prevIndex];
  setFindNewTrack(cloudinaryData, prevTrackData[0], setTrack, isPlaying);
};

export const setFindNewTrack = (
  cloudinaryData: CloudinaryResourceMap,
  assetId: string,
  setTrack: (track: TrackInfo, playImmediately: boolean) => void,
  isPlaying?: boolean
) => {
  if (cloudinaryData.size === 0) {
    console.error("Cloudinary data is empty");
    return;
  }

  const findTrackInData = cloudinaryData.get(assetId);

  if (!findTrackInData) {
    console.error("Track not found");
    return;
  }

  const newTrackInfo: TrackInfo = {
    assetId: findTrackInData.asset_id,
    album: findTrackInData.context.caption,
    name: findTrackInData.title,
    artworkId: findTrackInData.album_secure_url,
    url: findTrackInData.secure_url,
    producer: findTrackInData.producer,
  };
  setTrack(newTrackInfo, isPlaying || false);
};

export const useTrackStoreVariables = () => {
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const isPlaying = useTrackStore((state) => state.isPlaying);
  const currentTime = useTrackStore((state) => state.currentTime);
  const duration = useTrackStore((state) => state.duration);
  const isBuffering = useTrackStore((state) => state.isBuffering);
  const volume = useTrackStore((state) => state.volume);
  const isMuted = useTrackStore((state) => state.isMuted);
  const setTrack = useTrackStore((state) => state.setTrack);
  const storeTogglePlayPause = useTrackStore((state) => state.togglePlayPause);
  const storeSetVolume = useTrackStore((state) => state.setVolume);
  const storeSetCurrentTime = useTrackStore((state) => state.setCurrentTime);
  const storeSetDuration = useTrackStore((state) => state.setDuration);
  const storeSetIsBuffering = useTrackStore((state) => state.setIsBuffering);
  const storeToggleMute = useTrackStore((state) => state.toggleMute);
  const storeSeekTo = useTrackStore((state) => state.seekTo);

  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const isLoadingCloudinary = useCloudinaryStore(
    (state) => state.isLoadingCloudinary
  );

  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const analyserNode = useAudioInstanceStore((state) => state.audioAnalyser);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isBuffering,
    volume,
    isMuted,
    setTrack,
    storeTogglePlayPause,
    storeSetVolume,
    storeSetCurrentTime,
    storeSetDuration,
    storeSetIsBuffering,
    storeToggleMute,
    storeSeekTo,
    cloudinaryData,
    isLoadingCloudinary,
    audio,
    analyserNode,
    audioContext,
    cleanAudioInstance,
  };
};
