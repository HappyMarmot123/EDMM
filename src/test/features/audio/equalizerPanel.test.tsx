import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EqualizerPanel from "@/features/audio/components/equalizerPanel";
import { applyAudioEqualizerPreset } from "@/shared/lib/audioInstance";
import { getEqualizerPreset, setEqualizerPreset } from "@/shared/db";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";

jest.mock("@/shared/db", () => ({
  getEqualizerPreset: jest.fn(),
  setEqualizerPreset: jest.fn(),
}));

jest.mock("@/shared/lib/audioInstance", () => ({
  applyAudioEqualizerPreset: jest.fn(),
}));

jest.mock("@/shared/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(),
}));

const mockGetEqualizerPreset = getEqualizerPreset as jest.MockedFunction<
  typeof getEqualizerPreset
>;
const mockSetEqualizerPreset = setEqualizerPreset as jest.MockedFunction<
  typeof setEqualizerPreset
>;
const mockApplyAudioEqualizerPreset =
  applyAudioEqualizerPreset as jest.MockedFunction<
    typeof applyAudioEqualizerPreset
  >;
const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<
  typeof useMediaQuery
>;

describe("EqualizerPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEqualizerPreset.mockResolvedValue("flat");
    mockSetEqualizerPreset.mockResolvedValue(undefined);
    mockUseMediaQuery.mockReturnValue(true);
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
      expect(mockApplyAudioEqualizerPreset).toHaveBeenCalledWith("bass");
      expect(screen.getByRole("button", { name: "Bass Boost" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("applies and persists chosen preset on click (desktop)", async () => {
    render(<EqualizerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Bass Boost" }));

    await waitFor(() => {
      expect(mockApplyAudioEqualizerPreset).toHaveBeenCalledWith("bass");
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

    await Promise.resolve();
    expect(mockApplyAudioEqualizerPreset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Bass Boost" }));

    expect(mockApplyAudioEqualizerPreset).not.toHaveBeenCalled();
    expect(mockSetEqualizerPreset).not.toHaveBeenCalled();
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
