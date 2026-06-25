import { render, screen, waitFor } from "@testing-library/react";
import createGlobe from "cobe";
import type { COBEOptions } from "cobe";
import LandingCobeOrbit from "@/features/landing/ui/landingCobeOrbit";

jest.mock("cobe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn(), update: jest.fn() })),
}));

const mockedCreateGlobe = createGlobe as jest.MockedFunction<typeof createGlobe>;

type CobeOptionsWithRender = COBEOptions & {
  onRender?: (state: Partial<COBEOptions>) => void;
};

const getCobeOptions = async () => {
  await waitFor(() => expect(mockedCreateGlobe).toHaveBeenCalled());

  return mockedCreateGlobe.mock.calls[0][1] as CobeOptionsWithRender;
};

const dispatchPointerEvent = (
  element: Element,
  type: string,
  options: { clientX?: number; clientY?: number; pointerId?: number; button?: number } = {}
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    button: { value: options.button ?? 0 },
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
    pointerId: { value: options.pointerId ?? 1 },
  });

  element.dispatchEvent(event);
};

describe("LandingCobeOrbit", () => {
  beforeEach(() => {
    mockedCreateGlobe.mockClear();
  });

  it("renders the rose Cobe canvas in the retired orbit slot", () => {
    render(<LandingCobeOrbit />);

    expect(screen.getByTestId("rose-cobe-orbit")).toBeInTheDocument();
    expect(screen.getByTestId("rose-cobe-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("rose-hero-orbit")).not.toBeInTheDocument();
  });

  it("keeps rotating automatically through the Cobe render loop", async () => {
    render(<LandingCobeOrbit />);

    const options = await getCobeOptions();
    const firstState: Partial<COBEOptions> = {};
    const secondState: Partial<COBEOptions> = {};

    options.onRender?.(firstState);
    options.onRender?.(secondState);

    expect(secondState.phi).toBeGreaterThan(firstState.phi ?? 0);
    expect(secondState.theta).toBe(0.28);
  });

  it("lets mouse dragging steer the globe rotation", async () => {
    render(<LandingCobeOrbit />);

    const canvas = screen.getByTestId("rose-cobe-canvas");
    const options = await getCobeOptions();
    const draggedState: Partial<COBEOptions> = {};

    dispatchPointerEvent(canvas, "pointerdown", {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    dispatchPointerEvent(canvas, "pointermove", {
      clientX: 170,
      clientY: 70,
      pointerId: 1,
    });
    options.onRender?.(draggedState);

    expect(draggedState.phi).toBeGreaterThan(0.55);
    expect(draggedState.theta).toBeLessThan(0.28);
    expect(canvas).toHaveAttribute("data-dragging", "true");

    dispatchPointerEvent(canvas, "pointerup", { pointerId: 1 });

    expect(canvas).toHaveAttribute("data-dragging", "false");
  });
});
