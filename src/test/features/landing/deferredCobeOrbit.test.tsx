import { render, screen } from "@testing-library/react";
import { act } from "react";

import { DeferredCobeOrbit } from "@/features/landing/ui/deferredCobeOrbit";

jest.mock("@/features/landing/ui/landingCobeOrbit", () => ({
  __esModule: true,
  default: () => <div data-testid="landing-cobe-orbit" />,
}));

describe("DeferredCobeOrbit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Reflect.deleteProperty(window, "requestIdleCallback");
    Reflect.deleteProperty(window, "cancelIdleCallback");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a lightweight shell before the orbit is mounted", () => {
    render(<DeferredCobeOrbit />);

    expect(screen.getByTestId("rose-cobe-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-cobe-orbit")).not.toBeInTheDocument();
  });

  it("mounts the Cobe orbit after the fallback idle delay", async () => {
    render(<DeferredCobeOrbit />);

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    expect(await screen.findByTestId("landing-cobe-orbit")).toBeInTheDocument();
  });
});
