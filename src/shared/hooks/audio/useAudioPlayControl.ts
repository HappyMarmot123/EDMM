import { useCallback, useReducer, useEffect, useMemo } from "react";
import { isEmpty } from "lodash";
import { useAudioTrackManage } from "./useAudioTrackManage";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import { trackReducerState, trackReducerAction } from "@/shared/types/dataType";

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

export const useAudioPlayControl = () => {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const audioContext = useAudioInstanceStore((state) => state.audioContext);
  const currentTrack = useTrackStore((state) => state.currentTrack);
  const storeTogglePlayPause = useTrackStore((state) => state.togglePlayPause);
  const { handleSelectTrack } = useAudioTrackManage();

  const [state, dispatch] = useReducer(trackReducer, {
    trackId: null,
    trackEntries: [],
  });

  const trackEntries = useMemo(() => {
    if (isEmpty(cloudinaryData)) return [];
    const entries = Array.from(cloudinaryData.entries());

    return entries;
  }, [cloudinaryData]);

  useEffect(() => {
    dispatch({
      type: "UPDATE_TRACK_ENTRIES",
      payload: { trackEntries },
    });
  }, [trackEntries]);

  useEffect(() => {
    if (state.trackId && state.trackId !== currentTrack?.assetId) {
      handleSelectTrack(state.trackId);
    }
  }, [state.trackId, currentTrack?.assetId, handleSelectTrack]);

  const nextTrack = useCallback(() => {
    dispatch({
      type: "NEXT_TRACK",
      payload: { currentTrack },
    });
  }, [currentTrack]);

  const prevTrack = useCallback(() => {
    dispatch({
      type: "PREV_TRACK",
      payload: { currentTrack },
    });
  }, [currentTrack]);

  const togglePlayPause = async () => {
    if (!currentTrack) {
      return;
    }

    if (audioContext?.state === "suspended") {
      await audioContext.resume();
    }

    storeTogglePlayPause();
  };

  return {
    togglePlayPause,
    nextTrack,
    prevTrack,
  };
};
