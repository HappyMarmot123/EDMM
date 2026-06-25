import { render, screen } from "@testing-library/react";
import Landing from "@/widgets/landing";

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
    expect(screen.getByTestId("rose-hero-orbit")).toBeInTheDocument();
    expect(screen.getAllByTestId("rose-orbit-tracer")).toHaveLength(3);
    expect(screen.getByTestId("rose-orbit-core")).toBeInTheDocument();
    expect(screen.getAllByTestId("rose-orbit-core-pulse")).toHaveLength(2);
    expect(container.querySelector(".rose-hero__orbit-satellite")).toBeNull();
    expect(screen.getByRole("link", { name: "Start listening" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getByRole("link", { name: "Open library" })).toHaveAttribute(
      "href",
      "/library"
    );
    expect(screen.getAllByTestId("parallax")).toHaveLength(2);
    expect(container.querySelector(".rose-followup__links")).toBeNull();
    expect(screen.getByTestId("rose-footer")).toBeInTheDocument();
    expect(screen.getByText("EDMM / Rose Orbit")).toBeInTheDocument();
    expect(screen.queryByText("EDM Marmot")).not.toBeInTheDocument();
  });
});
