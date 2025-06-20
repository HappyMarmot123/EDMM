"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { isNumber, isEmpty } from "lodash";
import {
  togglePlayPauseLogic,
  seekLogic,
  playPrevTrackLogic,
  playNextTrackLogic,
  useTrackStoreVariables,
  setFindNewTrack,
} from "@/shared/lib/audioPlayerUtil";
import { setupAudioEventListeners } from "@/shared/lib/audioEventManager";

type AudioPlayerLogicReturnType = ReturnType<typeof useAudioPlayerLogic>;

const AudioPlayerContext = createContext<
  AudioPlayerLogicReturnType | undefined
>(undefined);

function useAudioPlayerLogic() {
  const isSeekingRef = useRef(false);

  const {
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
    storeSeekTo,
    storeToggleMute,
    cloudinaryData,
    isLoadingCloudinary,
    audio,
    analyserNode,
    audioContext,
    cleanAudioInstance,
  } = useTrackStoreVariables();

  // 오디오, 현재트랙 정보 업데이트
  useEffect(() => {
    const isTrackChanged = currentTrack && audio.src !== currentTrack.url;

    if (isTrackChanged && currentTrack.url) {
      audio.src = currentTrack.url;
      storeSetCurrentTime(0);
    }
  }, [currentTrack, audio, storeSetCurrentTime]);

  // 볼륨 설정
  useEffect(() => {
    if (isNumber(volume)) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audio]);

  // 트랙플레이 컨트롤
  useEffect(() => {
    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn("Error playing audio:", e);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // 첫 접근시 트랙 세팅
  useEffect(() => {
    const hasAlreadyTrackInStore = isEmpty(cloudinaryData) || currentTrack;
    if (hasAlreadyTrackInStore) return;

    if (cloudinaryData && cloudinaryData.size > 0) {
      const firstTrackAssetId = cloudinaryData.keys().next().value!!;
      setFindNewTrack(cloudinaryData, firstTrackAssetId, setTrack);
    }
  }, [cloudinaryData]);

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack && !isPlaying) return;
    await togglePlayPauseLogic({ audioContext, storeTogglePlayPause });
  }, [currentTrack, isPlaying, audioContext]);

  const seek = useCallback(
    (time: number) => {
      const currentAudioDuration = audio?.duration || 0;
      if (!currentTrack || !audio) return;
      seekLogic({
        audio,
        currentTrack,
        duration: currentAudioDuration,
        time,
        storeSeekTo,
        isSeekingRef,
      });
    },
    [currentTrack, audio, storeSeekTo]
  );

  const playNextTrack = () => {
    playNextTrackLogic({ cloudinaryData, currentTrack, setTrack, isPlaying });
  };

  const playPrevTrack = () => {
    playPrevTrackLogic({ cloudinaryData, currentTrack, setTrack, isPlaying });
  };

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      setFindNewTrack(cloudinaryData, assetId, setTrack);
    },
    [cloudinaryData]
  );

  const setLiveVolume = useCallback(
    (newVolume: number) => {
      if (isNumber(newVolume) && audio) {
        audio.volume = newVolume;
      }
    },
    [audio]
  );

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const actions = {
      storeSetCurrentTime,
      storeSetDuration,
      storeSetIsBuffering,
      setTrack,
    };

    const cleanup = setupAudioEventListeners(audio, actions, isSeekingRef);
    return cleanup;
  }, []);

  // 컴포넌트 언마운트 시 오디오 인스턴스 정리
  useEffect(() => {
    return () => {
      if (cleanAudioInstance) {
        cleanAudioInstance();
      }
    };
  }, [cleanAudioInstance]);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isBuffering,
    volume,
    isMuted,
    isLoadingCloudinary,
    togglePlayPause,
    seek,
    nextTrack: playNextTrack,
    prevTrack: playPrevTrack,
    handleSelectTrack,
    setVolume: storeSetVolume,
    setLiveVolume,
    toggleMute: storeToggleMute,
    analyserNode,
    audioPlayer: audio,
  };
}

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const audioPlayerData = useAudioPlayerLogic();
  return (
    <AudioPlayerContext.Provider value={audioPlayerData}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerLogicReturnType => {
  const context = useContext(AudioPlayerContext);
  if (!context)
    throw new Error("useAudioPlayer must be used within a AudioPlayerProvider");
  return context;
};
