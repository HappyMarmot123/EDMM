import { render } from "@testing-library/react";
import DeprecatedRoseHeroOrbit from "@/features/landing/ui/deprecatedRoseHeroOrbit";

describe("DeprecatedRoseHeroOrbit", () => {
  it("stays disabled by default while the Cobe hero visual is active", () => {
    const { container } = render(<DeprecatedRoseHeroOrbit />);

    expect(container.firstChild).toBeNull();
  });
});
