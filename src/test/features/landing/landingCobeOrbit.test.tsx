import { render, screen } from "@testing-library/react";
import createGlobe from "cobe";
import LandingCobeOrbit from "@/features/landing/ui/landingCobeOrbit";

jest.mock("cobe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
}));

const mockedCreateGlobe = createGlobe as jest.MockedFunction<typeof createGlobe>;

describe("LandingCobeOrbit", () => {
  beforeEach(() => {
    mockedCreateGlobe.mockClear();
  });

  it("renders the rose Cobe canvas in the retired orbit slot", () => {
    render(<LandingCobeOrbit />);

    expect(screen.getByTestId("rose-cobe-orbit")).toBeInTheDocument();
    expect(screen.getByTestId("rose-cobe-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("rose-hero-orbit")).not.toBeInTheDocument();
  });
});
