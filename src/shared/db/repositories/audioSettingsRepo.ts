import { getDefaultPreset, type EQPresetName } from "@/shared/lib/equalizer";
import { db } from "../edmmDB";

const EQ_PRESET_KEY = "equalizer.preset";

const isEQPresetName = (value: string): value is EQPresetName => {
  return value === "flat" || value === "bass" || value === "vocal";
};

export async function getEqualizerPreset(): Promise<EQPresetName> {
  try {
    const row = await db.audioSettings.get(EQ_PRESET_KEY);
    if (!row?.value || !isEQPresetName(row.value)) {
      return getDefaultPreset();
    }
    return row.value;
  } catch {
    return getDefaultPreset();
  }
}

export async function setEqualizerPreset(
  preset: EQPresetName,
): Promise<void> {
  try {
    await db.audioSettings.put({
      key: EQ_PRESET_KEY,
      value: preset,
    });
  } catch {
    // Storage failures should not crash playback.
  }
}
