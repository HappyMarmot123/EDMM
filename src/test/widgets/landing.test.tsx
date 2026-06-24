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
    render(<Landing />);

    expect(screen.getByTestId("rose-space-background")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "EDMM" })).toBeInTheDocument();
    expect(screen.getByText("Electronic Dance Music")).toBeInTheDocument();
    expect(
      screen.getByText("Rose signal / Dance floor / Night stream")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getAllByTestId("parallax")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "href",
      "/library"
    );
    expect(screen.queryByText("EDM Marmot")).not.toBeInTheDocument();
  });
});
