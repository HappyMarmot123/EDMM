import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

jest.mock("@/widgets/landing", () => ({
  __esModule: true,
  default: () => <main data-testid="landing-page">Landing</main>,
}));

jest.mock("@/views/home", () => ({
  __esModule: true,
  default: () => <div data-testid="home-view">HomeView</div>,
}));

jest.mock("@/widgets/audioPlayer/audioPlayerShell", () => ({
  __esModule: true,
  default: ({
    children,
  }: {
    children: (onPlay: () => void) => React.ReactNode;
  }) => <div data-testid="audio-shell">{children(() => undefined)}</div>,
}));

describe("App page", () => {
  it("renders the landing only on the home route", () => {
    render(<Page />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    expect(screen.queryByTestId("home-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("audio-shell")).not.toBeInTheDocument();
  });
});
