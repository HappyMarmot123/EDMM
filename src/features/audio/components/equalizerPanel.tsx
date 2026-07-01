import { useCallback, useEffect, useState } from "react";
import {
  EQ_PRESET_GAINS,
  applyEqualizerPreset,
  getDefaultPreset,
  type EQPresetName,
} from "@/shared/lib/equalizer";
import { getEqualizerFilters } from "@/shared/lib/audioInstance";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";
import MyTooltip from "@/shared/components/myTooltip";

const PRESET_LABELS: Record<EQPresetName, string> = {
  flat: "Flat",
  edm: "EDM",
  bass: "Bass",
  vocal: "Vocal",
};

const PRESET_HELP_TEXT: Record<EQPresetName, string> = {
  flat: "Keeps the original balance without EQ boosts.",
  edm: "Boosts bass, presence, and air for energetic electronic tracks.",
  bass: "Emphasizes kick and sub-bass while trimming some midrange.",
  vocal: "Pulls vocals and upper mids forward for clearer lead lines.",
};

const PRESET_OPTIONS = Object.keys(EQ_PRESET_GAINS) as EQPresetName[];

export default function EqualizerPanel() {
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

    const hydratePreset = async () => {
      try {
        const savedPreset = await getEqualizerPreset();
        if (!cancelled) {
          applyPreset(savedPreset);
        }
      } catch {
        if (!cancelled) {
          setCurrentPreset(getDefaultPreset());
          applyEqualizerPreset(getDefaultPreset(), getEqualizerFilters());
        }
      }
    };

    hydratePreset();

    return () => {
      cancelled = true;
    };
  }, [applyPreset]);

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
                onClick={() => applyPreset(preset)}
                className={`rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-150 ${
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
