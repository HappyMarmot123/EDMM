import { render, screen } from "@testing-library/react";
import { PerformanceInsights } from "@/app/performanceInsights";

jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}));

describe("PerformanceInsights", () => {
  it("renders the Vercel Speed Insights component", () => {
    render(<PerformanceInsights />);

    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });
});
