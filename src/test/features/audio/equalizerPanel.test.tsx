import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EqualizerPanel from "@/features/audio/components/equalizerPanel";
import { getEqualizerFilters } from "@/shared/lib/audioInstance";
import { EQ_PRESET_GAINS } from "@/shared/lib/equalizer";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";

jest.mock("@/shared/db", () => ({
  getEqualizerPreset: jest.fn(),
  setEqualizerPreset: jest.fn(),
}));

jest.mock("@/shared/lib/audioInstance", () => ({
  getEqualizerFilters: jest.fn(),
}));

const mockGetEqualizerPreset = getEqualizerPreset as jest.MockedFunction<
  typeof getEqualizerPreset
>;
const mockSetEqualizerPreset = setEqualizerPreset as jest.MockedFunction<
  typeof setEqualizerPreset
>;
const mockGetEqualizerFilters = getEqualizerFilters as jest.MockedFunction<
  typeof getEqualizerFilters
>;
const mockFilters = EQ_PRESET_GAINS.flat.map(() => ({
  gain: { value: 0 },
})) as BiquadFilterNode[];

describe("EqualizerPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilters.forEach((filter) => {
      filter.gain.value = 0;
    });
    mockGetEqualizerPreset.mockResolvedValue("flat");
    mockSetEqualizerPreset.mockResolvedValue(undefined);
    mockGetEqualizerFilters.mockReturnValue(mockFilters);
  });

  it("renders the available pro presets with labels", () => {
    render(<EqualizerPanel />);

    expect(screen.getByRole("button", { name: "Flat" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bass Boost" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear Vocal" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EDM" })).not.toBeInTheDocument();
  });

  it("hydrates persisted preset through the engine on mount (desktop)", async () => {
    mockGetEqualizerPreset.mockResolvedValue("bass");

    render(<EqualizerPanel />);

    await waitFor(() => {
      expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
        EQ_PRESET_GAINS.bass,
      );
      expect(screen.getByRole("button", { name: "Bass Boost" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("applies and persists chosen preset on click (desktop)", async () => {
    render(<EqualizerPanel />);

    await waitFor(() => {
      expect(mockGetEqualizerFilters).toHaveBeenCalled();
    });
    mockSetEqualizerPreset.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Bass Boost" }));

    await waitFor(() => {
      expect(mockFilters.map((filter) => filter.gain.value)).toEqual(
        EQ_PRESET_GAINS.bass,
      );
      expect(mockSetEqualizerPreset).toHaveBeenCalledWith("bass");
      expect(screen.getByRole("button", { name: "Bass Boost" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("keeps selected preset active when preset persistence fails", async () => {
    mockGetEqualizerPreset.mockResolvedValue("flat");

    render(<EqualizerPanel />);

    await waitFor(() => {
      expect(mockSetEqualizerPreset).toHaveBeenCalledWith("flat");
    });
    mockSetEqualizerPreset.mockClear();
    mockSetEqualizerPreset.mockRejectedValueOnce(new Error("write blocked"));

    fireEvent.click(screen.getByRole("button", { name: "Bass Boost" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bass Boost" })).toHaveAttribute(
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

  it("explains each preset with tooltip help text", async () => {
    render(<EqualizerPanel />);

    await Promise.resolve();

    expect(screen.getByRole("button", { name: "Flat" })).toHaveAccessibleDescription(
      "Keeps the original balance with no EQ coloring, the neutral reference.",
    );
    expect(
      screen.getByRole("button", { name: "Bass Boost" }),
    ).toHaveAccessibleDescription(
      "Big sub and low-end punch with a clean midrange scoop.",
    );
  });

  it("describes each preset with accessible help text", () => {
    render(<EqualizerPanel />);

    expect(
      screen.getByRole("button", { name: "Bass Boost" }),
    ).toHaveAccessibleDescription(
      "Big sub and low-end punch with a clean midrange scoop.",
    );
    expect(
      screen.queryByRole("button", { name: "Clear Vocal" }),
    ).not.toBeInTheDocument();
  });
});
