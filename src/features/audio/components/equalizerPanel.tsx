import {
  type EQPresetName,
} from "@/shared/lib/equalizer";
import { useEqualizerPresetController } from "../hooks/useEqualizerPresetController";
import MyTooltip from "@/shared/components/myTooltip";

const EQ_ENABLED_QUERY = "(min-width: 768px)";

const PRESET_LABELS: Record<EQPresetName, string> = {
  flat: "Flat",
  bass: "Bass Boost",
};

const PRESET_HELP_TEXT: Record<EQPresetName, string> = {
  flat: "Keeps the original balance with no EQ coloring, the neutral reference.",
  bass: "Big sub and low-end punch with a clean midrange scoop.",
};

export default function EqualizerPanel() {
  const { currentPreset, applyPreset, presetOptions } =
    useEqualizerPresetController();

  return (
    <section
      className="flex flex-col items-start gap-2"
      aria-label="Equalizer presets"
    >
      <p className="text-xs font-black uppercase text-[#ff98a2]">EQ Presets</p>
      <div className="flex flex-wrap gap-2">
        {presetOptions.map((preset) => {
          const descriptionId = `eq-preset-${preset}-description`;
          const label = PRESET_LABELS[preset];
          const helpText = PRESET_HELP_TEXT[preset];

          return (
            <MyTooltip key={preset} tooltipText={helpText}>
              <button
                type="button"
                onClick={() => applyPreset(preset)}
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
