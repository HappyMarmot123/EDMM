import useTrackStore from "@/app/store/trackStore";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

export const useAudioState = () => {
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
