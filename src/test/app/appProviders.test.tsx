import { act, render, screen } from "@testing-library/react";
import { readFileSync } from "fs";
import path from "path";
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

const installIdleCallbackMock = () => {
  const idleCallbacks: IdleRequestCallback[] = [];
  const originalRequestIdleCallback = window.requestIdleCallback;
  const originalCancelIdleCallback = window.cancelIdleCallback;
  const requestIdleCallback = jest.fn((callback: IdleRequestCallback) => {
    idleCallbacks.push(callback);
    return idleCallbacks.length;
  });
  const cancelIdleCallback = jest.fn();

  Object.defineProperty(window, "requestIdleCallback", {
    configurable: true,
    value: requestIdleCallback,
  });
  Object.defineProperty(window, "cancelIdleCallback", {
    configurable: true,
    value: cancelIdleCallback,
  });

  return {
    idleCallbacks,
    requestIdleCallback,
    restore: () => {
      Object.defineProperty(window, "requestIdleCallback", {
        configurable: true,
        value: originalRequestIdleCallback,
      });
      Object.defineProperty(window, "cancelIdleCallback", {
        configurable: true,
        value: originalCancelIdleCallback,
      });
    },
  };
};

describe("AppProviders", () => {
  it("keeps audio providers and player widget mounted above route content", async () => {
    const idle = installIdleCallbackMock();

    render(
      <AppProviders>
        <main data-testid="route-content">Route</main>
      </AppProviders>
    );

    expect(screen.getByTestId("tanstack-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-provider")).toBeInTheDocument();
    expect(screen.getByTestId("route-content")).toBeInTheDocument();
    await act(async () => {
      idle.idleCallbacks[0]?.({
        didTimeout: false,
        timeRemaining: () => 50,
      });
    });
    expect(await screen.findByTestId("audio-widget")).toBeInTheDocument();
    idle.restore();
  });

  it("waits for browser idle before mounting the audio player widget", async () => {
    const idle = installIdleCallbackMock();

    render(
      <AppProviders>
        <main data-testid="route-content">Route</main>
      </AppProviders>
    );

    expect(idle.requestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 1800 },
    );
    expect(screen.getByTestId("route-content")).toBeInTheDocument();
    expect(screen.queryByTestId("audio-widget")).not.toBeInTheDocument();

    await act(async () => {
      idle.idleCallbacks[0]?.({
        didTimeout: false,
        timeRemaining: () => 50,
      });
    });

    expect(await screen.findByTestId("audio-widget")).toBeInTheDocument();
    idle.restore();
  });

  it("defers the audio player widget out of the route's critical bundle", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/appProviders.tsx"),
      "utf8",
    );

    expect(source).toContain('from "next/dynamic"');
    expect(source).toContain("dynamic(() => import(\"@/widgets/audioPlayer\")");
    expect(source).not.toMatch(
      /^import\s+AudioPlayerWidget\s+from\s+["']@\/widgets\/audioPlayer["'];/m,
    );
  });
});
