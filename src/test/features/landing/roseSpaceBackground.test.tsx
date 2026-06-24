import { render, screen, waitFor } from "@testing-library/react";
import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";

describe("RoseSpaceBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an aria-hidden rose space background", async () => {
    render(<RoseSpaceBackground />);

    const background = screen.getByTestId("rose-space-background");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveClass("rose-space-background");

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toBeInTheDocument();
    });
  });

  it("marks the background as reduced when prefers-reduced-motion is active", async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<RoseSpaceBackground />);

    expect(screen.getByTestId("rose-space-background")).toHaveAttribute(
      "data-reduced-motion",
      "true"
    );

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toHaveClass(
        "rose-starfield--reduced"
      );
    });
  });
});
