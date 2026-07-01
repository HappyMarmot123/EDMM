import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EqualizerPanel from "@/features/audio/components/equalizerPanel";
import { EQ_PRESET_GAINS } from "@/shared/lib/equalizer";
import type { EQPresetName } from "@/shared/lib/equalizer";

const mockFilters = [
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
] as BiquadFilterNode[];

const mockGetEqualizerPreset = jest.fn<Promise<EQPresetName>, []>();
const mockSetEqualizerPreset = jest.fn();

jest.mock("@/shared/db", () => ({
  getEqualizerPreset: mockGetEqualizerPreset,
  setEqualizerPreset: mockSetEqualizerPreset,
}));

jest.mock("@/shared/lib/audioInstance", () => ({
  getEqualizerFilters: () => mockFilters,
}));

describe("EqualizerPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilters.forEach((filter) => {
      filter.gain.value = 0;
    });
    mockGetEqualizerPreset.mockResolvedValue("flat");
  });

  it("loads persisted preset and applies preset gains on mount", async () => {
    render(<EqualizerPanel />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bass" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(screen.getByRole("button", { name: "Flat" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
      EQ_PRESET_GAINS.flat,
    );
  });

  it("applies and persists chosen preset on click", async () => {
    mockGetEqualizerPreset.mockResolvedValue("flat");

    render(<EqualizerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "EDM" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "EDM" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(mockSetEqualizerPreset).toHaveBeenCalledWith("edm");
      expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
        EQ_PRESET_GAINS.edm,
      );
    });
  });
});
