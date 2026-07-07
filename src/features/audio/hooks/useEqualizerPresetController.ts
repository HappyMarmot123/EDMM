import { useCallback, useEffect, useState } from "react";
import {
  EQ_PRESET_GAINS,
  applyEqualizerPreset,
  getDefaultPreset,
  type EQPresetName,
} from "@/shared/lib/equalizer";
import { getEqualizerFilters } from "@/shared/lib/audioInstance";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";

const PRESET_OPTIONS = Object.keys(EQ_PRESET_GAINS) as EQPresetName[];

export function useEqualizerPresetController() {
  const [currentPreset, setCurrentPreset] = useState<EQPresetName>(
    getDefaultPreset(),
  );

  const applyPreset = useCallback((preset: EQPresetName) => {
    const filters = getEqualizerFilters();
    applyEqualizerPreset(preset, filters);
    setCurrentPreset(preset);
    void setEqualizerPreset(preset).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runHydration = async () => {
      try {
        const savedPreset = await getEqualizerPreset();
        if (!cancelled) {
          applyPreset(savedPreset);
        }
      } catch {
        if (!cancelled) {
          const defaultPreset = getDefaultPreset();
          setCurrentPreset(defaultPreset);
          applyEqualizerPreset(defaultPreset, getEqualizerFilters());
        }
      }
    };

    void runHydration();

    return () => {
      cancelled = true;
    };
  }, [applyPreset]);

  return {
    currentPreset,
    presetOptions: PRESET_OPTIONS,
    applyPreset,
  };
}
