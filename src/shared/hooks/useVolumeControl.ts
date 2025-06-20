import { useState, useRef, useEffect } from "react";

export function useVolumeControl(
  volume: number,
  setVolume: (volume: number) => void,
  setLiveVolume: (volume: number) => void,
  isMuted: boolean,
  toggleMute: () => void
) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeSliderTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setLocalVolume(newVolume);
    setLiveVolume(newVolume);
    if (isMuted && newVolume > 0) {
      toggleMute();
    }
  };

  const handleVolumeChangeEnd = () => {
    setVolume(localVolume);
  };

  const handleVolumeMouseEnter = () => {
    if (volumeSliderTimeoutId.current) {
      clearTimeout(volumeSliderTimeoutId.current);
      volumeSliderTimeoutId.current = null;
    }
    setShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = () => {
    volumeSliderTimeoutId.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  };

  return {
    localVolume,
    showVolumeSlider,
    handleVolumeChange,
    handleVolumeChangeEnd,
    handleVolumeMouseEnter,
    handleVolumeMouseLeave,
  };
}
