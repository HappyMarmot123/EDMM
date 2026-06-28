import { render, screen } from "@testing-library/react";
import { AppProviders } from "@/app/appProviders";

jest.mock("@/shared/providers/tanstackProvider", () => ({
  TanstackProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tanstack-provider">{children}</div>
  ),
}));

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  AudioPlayerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="audio-provider">{children}</div>
  ),
}));

jest.mock("@/shared/providers/toggleProvider", () => ({
  ToggleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toggle-provider">{children}</div>
  ),
}));

jest.mock("@/widgets/audioPlayer", () => ({
  __esModule: true,
  default: () => <div data-testid="audio-widget" />,
}));

describe("AppProviders", () => {
  it("keeps audio providers and player widget mounted above route content", () => {
    render(
      <AppProviders>
        <main data-testid="route-content">Route</main>
      </AppProviders>
    );

    expect(screen.getByTestId("tanstack-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-provider")).toBeInTheDocument();
    expect(screen.getByTestId("route-content")).toBeInTheDocument();
    expect(screen.getByTestId("audio-widget")).toBeInTheDocument();
  });
});
