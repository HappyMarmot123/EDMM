import { useEffect } from "react";
import { isNumber } from "lodash";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";
import { useAudioSeeking } from "./useAudioSeeking";
import { useAudioPlayControl } from "./useAudioPlayControl";

export const useAudioEffects = () => {
  const audio = useAudioInstanceStore(
    (state) => state.audioInstance
  ) as HTMLAudioElement;
  const cleanAudioInstance = useAudioInstanceStore(
    (state) => state.cleanAudioInstance
  );

  const { isSeekingRef } = useAudioSeeking();
  const { nextTrack } = useAudioPlayControl();

  const currentTrack = useTrackStore((state) => state.currentTrack);
  const isPlaying = useTrackStore((state) => state.isPlaying);
  const volume = useTrackStore((state) => state.volume);
  const isMuted = useTrackStore((state) => state.isMuted);
  const storeSetCurrentTime = useTrackStore((state) => state.setCurrentTime);
  const storeSetDuration = useTrackStore((state) => state.setDuration);
  const storeSetIsBuffering = useTrackStore((state) => state.setIsBuffering);

  // 1. Sync track change
  useEffect(() => {
    const isTrackChanged = currentTrack?.url && audio.src !== currentTrack.url;
    if (isTrackChanged) {
      audio.src = currentTrack.url;
      storeSetCurrentTime(0);
    }
  }, [currentTrack, audio, storeSetCurrentTime]);

  // 2. Sync play/pause state
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch((e) => console.warn("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, audio]); // `currentTrack` is needed to ensure play() is called after src change

  // 3. Sync volume/mute state
  useEffect(() => {
    if (isNumber(volume)) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audio]);

  // 4. Setup audio event listeners
  useEffect(() => {
    const actions = {
      state: {
        audio,
        storeSetCurrentTime,
        storeSetDuration,
        storeSetIsBuffering,
      },
      isSeekingRef,
      nextTrack,
    };
    const cleanup = setupAudioEventListeners(actions);
    return cleanup;
  }, [
    audio,
    isSeekingRef,
    nextTrack,
    storeSetCurrentTime,
    storeSetDuration,
    storeSetIsBuffering,
  ]);

  // 5. Cleanup audio instance on unmount
  useEffect(() => {
    return () => {
      if (cleanAudioInstance) {
        cleanAudioInstance();
      }
    };
  }, [cleanAudioInstance]);
};
