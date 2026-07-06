import { render, screen, within } from "@testing-library/react";

import { Parallax } from "@/features/landing/components/parallax";

describe("Parallax", () => {
  it("keeps the parallax band with repeated content", () => {
    render(<Parallax>Electronic</Parallax>);

    const marquee = screen.getByTestId("rose-css-marquee");

    expect(marquee).toHaveAttribute("data-direction", "forward");
    expect(within(marquee).getAllByText("Electronic")).toHaveLength(8);
  });

  it("keeps reverse movement for negative velocity", () => {
    render(<Parallax baseVelocity={-2}>Dance Music</Parallax>);

    expect(screen.getByTestId("rose-css-marquee")).toHaveAttribute(
      "data-direction",
      "reverse",
    );
  });
});