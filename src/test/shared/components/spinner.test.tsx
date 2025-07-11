import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "../../../shared/components/spinner";

describe("Spinner (Centralized Test)", () => {
  it("renders without crashing", () => {
    const { container } = render(<Spinner />);
    expect(container).toBeInTheDocument();
  });

  it("renders with correct outer container CSS classes", () => {
    const { container } = render(<Spinner />);
    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "min-h-screen"
    );
  });

  it("contains a spinning element with correct classes", () => {
    const { container } = render(<Spinner />);
    const spinElement = container.querySelector(".animate-spin");
    expect(spinElement).toBeInTheDocument();
    expect(spinElement).toHaveClass(
      "w-16",
      "h-16",
      "border-4",
      "border-blue-500",
      "border-t-transparent",
      "rounded-full",
      "animate-spin"
    );
  });
});
