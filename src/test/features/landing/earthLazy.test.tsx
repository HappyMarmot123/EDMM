import { render, screen } from "@testing-library/react";
import EarthLazy from "@/features/landing/components/earthLazy";

it("renders the lazy earth mount slot before it enters view", () => {
  render(<EarthLazy />);

  expect(screen.getByTestId("earth-slot")).toBeInTheDocument();
});
