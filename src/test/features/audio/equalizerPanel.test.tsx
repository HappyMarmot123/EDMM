import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EqualizerPanel from "@/features/audio/components/equalizerPanel";
import { EQ_PRESET_GAINS } from "@/shared/lib/equalizer";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";

const mockFilters = [
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
  { gain: { value: 0 } },
] as BiquadFilterNode[];

jest.mock("@/shared/db", () => ({
  getEqualizerPreset: jest.fn(),
  setEqualizerPreset: jest.fn(),
}));

jest.mock("@/shared/lib/audioInstance", () => ({
  getEqualizerFilters: () => mockFilters,
}));

const mockGetEqualizerPreset = getEqualizerPreset as jest.MockedFunction<
  typeof getEqualizerPreset
>;
const mockSetEqualizerPreset = setEqualizerPreset as jest.MockedFunction<
  typeof setEqualizerPreset
>;

describe("EqualizerPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilters.forEach((filter) => {
      filter.gain.value = 0;
    });
    mockGetEqualizerPreset.mockResolvedValue("flat");
    mockSetEqualizerPreset.mockResolvedValue(undefined);
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

  it("keeps selected preset active when preset persistence fails", async () => {
    mockGetEqualizerPreset.mockResolvedValue("flat");

    render(<EqualizerPanel />);

    mockSetEqualizerPreset.mockClear();
    mockSetEqualizerPreset.mockRejectedValueOnce(new Error("write blocked"));

    fireEvent.click(screen.getByRole("button", { name: "Bass" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bass" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(mockSetEqualizerPreset).toHaveBeenCalledWith("bass");
      expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
        EQ_PRESET_GAINS.bass,
      );
    });
  });

  it("applies the default preset when hydration fails", async () => {
    mockGetEqualizerPreset.mockRejectedValueOnce(new Error("read blocked"));

    render(<EqualizerPanel />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Flat" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
        EQ_PRESET_GAINS.flat,
      );
    });

    expect(mockSetEqualizerPreset).not.toHaveBeenCalled();
  });

  it("explains each preset with tooltip help text", () => {
    render(<EqualizerPanel />);

    expect(screen.getByRole("button", { name: "Flat" })).not.toHaveAttribute(
      "title",
    );
    expect(screen.getByRole("button", { name: "EDM" })).toHaveAccessibleDescription(
      "Boosts bass, presence, and air for energetic electronic tracks.",
    );
    expect(screen.getByRole("button", { name: "Bass" })).toHaveAccessibleDescription(
      "Emphasizes kick and sub-bass while trimming some midrange.",
    );
    expect(screen.getByRole("button", { name: "Vocal" })).toHaveAccessibleDescription(
      "Pulls vocals and upper mids forward for clearer lead lines.",
    );
  });
});
