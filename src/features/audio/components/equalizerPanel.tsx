import { useCallback, useEffect, useState } from "react";
import {
  EQ_PRESET_GAINS,
  getDefaultPreset,
  type EQPresetName,
} from "@/shared/lib/equalizer";
import { applyAudioEqualizerPreset } from "@/shared/lib/audioInstance";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import MyTooltip from "@/shared/components/myTooltip";

const EQ_ENABLED_QUERY = "(min-width: 768px)";

const PRESET_LABELS: Record<EQPresetName, string> = {
  flat: "Flat",
  bass: "Bass Boost",
  vocal: "Clear Vocal",
};

const PRESET_HELP_TEXT: Record<EQPresetName, string> = {
  flat: "Keeps the original balance with no EQ coloring, the neutral reference.",
  bass: "Big sub and low-end punch with a clean midrange scoop.",
  vocal: "Pushes vocal presence and clarity while trimming low-end mud.",
};

const PRESET_OPTIONS = Object.keys(EQ_PRESET_GAINS) as EQPresetName[];

export default function EqualizerPanel() {
  const isEqEnabled = useMediaQuery(EQ_ENABLED_QUERY, false);
  const [currentPreset, setCurrentPreset] = useState<EQPresetName>(
    getDefaultPreset(),
  );

  const applyPreset = useCallback((preset: EQPresetName) => {
    applyAudioEqualizerPreset(preset);
    setCurrentPreset(preset);
    void setEqualizerPreset(preset).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEqEnabled) {
      return;
    }

    let cancelled = false;

    const hydratePreset = async () => {
      try {
        const savedPreset = await getEqualizerPreset();
        if (!cancelled) {
          applyPreset(savedPreset);
        }
      } catch {
        if (!cancelled) {
          applyPreset(getDefaultPreset());
        }
      }
    };

    hydratePreset();

    return () => {
      cancelled = true;
    };
  }, [isEqEnabled, applyPreset]);

  return (
    <section
      className="flex flex-col items-start gap-2"
      aria-label="Equalizer presets"
    >
      <p className="text-xs font-black uppercase text-[#ff98a2]">EQ Presets</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_OPTIONS.map((preset) => {
          const descriptionId = `eq-preset-${preset}-description`;
          const label = PRESET_LABELS[preset];
          const helpText = PRESET_HELP_TEXT[preset];

          return (
            <MyTooltip key={preset} tooltipText={helpText}>
              <button
                type="button"
                onClick={() => {
                  if (isEqEnabled) {
                    applyPreset(preset);
                  }
                }}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-150 ${
                  currentPreset === preset
                    ? "bg-[#ff98a2] text-black"
                    : "border-white/25 bg-white/10 text-white/80 hover:border-[#ff98a2]/55 hover:text-white"
                }`}
                aria-label={label}
                aria-describedby={descriptionId}
                aria-pressed={currentPreset === preset}
              >
                {label}
                <span id={descriptionId} className="sr-only">
                  {helpText}
                </span>
              </button>
            </MyTooltip>
          );
        })}
      </div>
    </section>
  );
}
