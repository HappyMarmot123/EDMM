import { useCallback, useEffect, useReducer, useMemo } from "react";
import { isEmpty } from "lodash";
import {
  type TrackInfo,
  type CloudinaryResource,
  type CloudinaryResourceMap,
  type trackReducerState,
  type trackReducerAction,
} from "@/shared/types/dataType";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";

const trackReducer = (
  state: trackReducerState,
  action: trackReducerAction
): trackReducerState => {
  switch (action.type) {
    case "UPDATE_TRACK_ENTRIES": {
      return {
        ...state,
        trackEntries: action.payload.trackEntries,
      };
    }
    case "NEXT_TRACK": {
      const { currentTrack } = action.payload;
      if (isEmpty(state.trackEntries)) return { ...state, trackId: null };

      const currentIndex = currentTrack
        ? state.trackEntries.findIndex(([id]) => id === currentTrack.assetId)
        : -1;

      if (currentIndex === -1) {
        return { ...state, trackId: state.trackEntries[0][0] };
      }
      const nextIndex = (currentIndex + 1) % state.trackEntries.length;
      return { ...state, trackId: state.trackEntries[nextIndex][0] };
    }
    case "PREV_TRACK": {
      const { currentTrack } = action.payload;
      if (isEmpty(state.trackEntries)) return { ...state, trackId: null };

      const currentIndex = currentTrack
        ? state.trackEntries.findIndex(([id]) => id === currentTrack.assetId)
        : -1;

      if (currentIndex === -1) {
        return { ...state, trackId: state.trackEntries[0][0] };
      }
      const prevIndex =
        (currentIndex - 1 + state.trackEntries.length) %
        state.trackEntries.length;
      return { ...state, trackId: state.trackEntries[prevIndex][0] };
    }
    default:
      return state;
  }
};

const findAndSetTrack = (
  cloudinaryData: CloudinaryResourceMap,
  assetId: string,
  setTrack: (track: TrackInfo, playImmediately: boolean) => void,
  isPlaying?: boolean
) => {
  if (isEmpty(cloudinaryData)) {
    console.error("Cloudinary data is empty");
    return;
  }
  const findTrackInData = cloudinaryData.get(assetId);
  if (!findTrackInData) {
    console.error("Track not found in cloudinary data:", assetId);
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

export const useAudioTrackManage = () => {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const {
    currentTrack,
    isPlaying,
    setTrack,
    togglePlayPause: storeTogglePlayPause,
  } = useTrackStore((state) => state);
  const { audioContext } = useAudioInstanceStore((state) => state);

  const [state, dispatch] = useReducer(trackReducer, {
    trackId: null,
    trackEntries: [],
  });

  const trackEntries: [string, CloudinaryResource][] = useMemo(() => {
    if (isEmpty(cloudinaryData)) return [];
    return Array.from(cloudinaryData.entries());
  }, [cloudinaryData]);

  useEffect(() => {
    dispatch({
      type: "UPDATE_TRACK_ENTRIES",
      payload: { trackEntries },
    });
  }, [trackEntries]);

  useEffect(() => {
    const hasNoDataOrTrack = isEmpty(cloudinaryData) || currentTrack;
    if (hasNoDataOrTrack) return;

    const firstTrackAssetId = cloudinaryData.keys().next().value;
    if (firstTrackAssetId) {
      findAndSetTrack(cloudinaryData, firstTrackAssetId, setTrack);
    }
  }, [cloudinaryData, currentTrack, setTrack]);

  useEffect(() => {
    if (state.trackId && state.trackId !== currentTrack?.assetId) {
      findAndSetTrack(cloudinaryData, state.trackId, setTrack, isPlaying);
    }
  }, [
    state.trackId,
    currentTrack?.assetId,
    cloudinaryData,
    setTrack,
    isPlaying,
  ]);

  const handleSelectTrack = useCallback(
    (assetId: string) => {
      if (assetId === currentTrack?.assetId) return;
      findAndSetTrack(cloudinaryData, assetId, setTrack, isPlaying);
    },
    [cloudinaryData, currentTrack?.assetId, isPlaying, setTrack]
  );

  const playNextTrack = useCallback(() => {
    dispatch({
      type: "NEXT_TRACK",
      payload: { currentTrack },
    });
  }, [currentTrack]);

  const playPrevTrack = useCallback(() => {
    dispatch({
      type: "PREV_TRACK",
      payload: { currentTrack },
    });
  }, [currentTrack]);

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }

    storeTogglePlayPause();
  }, [audioContext, currentTrack, storeTogglePlayPause]);

  return {
    handleSelectTrack,
    playNextTrack,
    playPrevTrack,
    togglePlayPause,
  };
};
