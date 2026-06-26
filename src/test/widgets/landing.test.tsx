import { render, screen } from "@testing-library/react";
import Landing from "@/widgets/landing";

jest.mock("cobe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
}));

jest.mock("@/features/landing/components/parallax", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="parallax">{children}</div>
  ),
}));

describe("Landing", () => {
  it("renders the Rose Orbit landing without old visual clutter", () => {
    const { container } = render(<Landing />);

    expect(screen.getByRole("main")).toHaveClass("rose-landing", "my-gradient");
    expect(screen.getByTestId("rose-space-background")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "EDMM" })).toBeInTheDocument();
    expect(
      screen.getByText("Electronic dance music in rose orbit")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rose Orbit / Midnight signal / Dance floor")
    ).toBeInTheDocument();
    expect(screen.getByTestId("rose-cobe-orbit")).toBeInTheDocument();
    expect(screen.getByTestId("rose-cobe-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("rose-hero-orbit")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("rose-orbit-tracer")).toHaveLength(0);
    expect(screen.queryByTestId("rose-orbit-core")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("rose-orbit-core-pulse")).toHaveLength(0);
    expect(container.querySelector(".rose-hero__orbit-satellite")).toBeNull();
    expect(screen.getByRole("link", { name: "Start listening" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getAllByTestId("parallax")).toHaveLength(2);
    expect(container.querySelector(".rose-followup__links")).toBeNull();
    expect(screen.getByTestId("rose-footer")).toBeInTheDocument();
    expect(screen.getByText("EDMM / Rose Orbit")).toBeInTheDocument();
    expect(screen.queryByText("EDM Marmot")).not.toBeInTheDocument();
  });
});
