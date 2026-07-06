import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import DevErrorRemote from "@/shared/dev/devErrorRemote";
import { runDevErrorMockScenario } from "@/shared/dev/errorMockScenarios";

jest.mock("@/shared/dev/errorMockScenarios", () => ({
  DEV_ERROR_MOCK_SCENARIOS: [
    {
      id: "catalog_fetch_failed",
      label: "Catalog",
      description: "Mock catalog failure",
    },
    {
      id: "route_render_failed",
      label: "Route",
      description: "Mock route render failure",
    },
  ],
  runDevErrorMockScenario: jest.fn(() => ({
    message: "Catalog failure was mocked.",
    scenarioId: "catalog_fetch_failed",
    title: "Catalog mock triggered",
  })),
}));

const mockRunDevErrorMockScenario =
  runDevErrorMockScenario as jest.MockedFunction<typeof runDevErrorMockScenario>;

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { didCatch: boolean }
> {
  state = { didCatch: false };

  static getDerivedStateFromError() {
    return { didCatch: true };
  }

  render() {
    if (this.state.didCatch) {
      return <div data-testid="route-render-error-caught" />;
    }

    return this.props.children;
  }
}

describe("DevErrorRemote", () => {
  beforeEach(() => {
    mockRunDevErrorMockScenario.mockClear();
  });

  it("renders testable controls for development error scenarios", () => {
    render(<DevErrorRemote />);

    expect(
      screen.getByRole("region", { name: "Development error remote" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dev-error-remote-catalog_fetch_failed"),
    ).toHaveTextContent("Catalog");
    expect(
      screen.getByTestId("dev-error-remote-route_render_failed"),
    ).toHaveTextContent("Route");
  });

  it("runs a selected non-render scenario from a button click", () => {
    render(<DevErrorRemote />);

    fireEvent.click(screen.getByTestId("dev-error-remote-catalog_fetch_failed"));

    expect(mockRunDevErrorMockScenario).toHaveBeenCalledWith(
      "catalog_fetch_failed",
    );
  });

  it("shows visible feedback after a selected non-render scenario runs", () => {
    render(<DevErrorRemote />);

    fireEvent.click(screen.getByTestId("dev-error-remote-catalog_fetch_failed"));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Catalog mock triggered",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Catalog failure was mocked.",
    );
  });

  it("can trigger a render failure for route boundary testing", () => {
    render(
      <TestErrorBoundary>
        <DevErrorRemote />
      </TestErrorBoundary>,
    );

    fireEvent.click(screen.getByTestId("dev-error-remote-route_render_failed"));

    expect(screen.getByTestId("route-render-error-caught")).toBeInTheDocument();
  });
});
