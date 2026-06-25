import { render, screen, waitFor } from "@testing-library/react";
import createGlobe from "cobe";
import type { COBEOptions, Globe } from "cobe";
import LandingCobeOrbit from "@/features/landing/ui/landingCobeOrbit";

type MockGlobe = {
  destroy: jest.Mock;
  update: jest.Mock;
};

jest.mock("cobe", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedCreateGlobe = createGlobe as jest.MockedFunction<typeof createGlobe>;

let animationFrames: FrameRequestCallback[] = [];
let frameId = 0;
let globe: MockGlobe;

const getCobeOptions = async () => {
  await waitFor(() => expect(mockedCreateGlobe).toHaveBeenCalled());

  return mockedCreateGlobe.mock.calls[0][1] as COBEOptions;
};

const runAnimationFrame = () => {
  const frame = animationFrames.shift();

  if (!frame) {
    throw new Error("Expected a queued animation frame");
  }

  frame(performance.now());
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
    animationFrames = [];
    frameId = 0;
    globe = { destroy: jest.fn(), update: jest.fn() };
    mockedCreateGlobe.mockImplementation(() => globe as unknown as Globe);
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationFrames.push(callback);
      frameId += 1;
      return frameId;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(jest.fn());
  });

  afterEach(() => {
    mockedCreateGlobe.mockReset();
    jest.restoreAllMocks();
  });

  it("renders the rose Cobe canvas in the retired orbit slot", () => {
    render(<LandingCobeOrbit />);

    expect(screen.getByTestId("rose-cobe-orbit")).toBeInTheDocument();
    expect(screen.getByTestId("rose-cobe-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("rose-hero-orbit")).not.toBeInTheDocument();
  });

  it("keeps rotating automatically through the Cobe render loop", async () => {
    render(<LandingCobeOrbit />);

    await getCobeOptions();
    runAnimationFrame();
    runAnimationFrame();

    const [firstState] = globe.update.mock.calls[0] as [Partial<COBEOptions>];
    const [secondState] = globe.update.mock.calls[1] as [Partial<COBEOptions>];

    expect(secondState.phi).toBeGreaterThan(firstState.phi ?? 0);
    expect(secondState.theta).toBe(0.28);
  });

  it("lets mouse dragging steer the globe rotation", async () => {
    render(<LandingCobeOrbit />);

    const canvas = screen.getByTestId("rose-cobe-canvas");
    await getCobeOptions();

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
    runAnimationFrame();

    const [draggedState] = globe.update.mock.calls.at(-1) as [Partial<COBEOptions>];

    expect(draggedState.phi).toBeGreaterThan(0.55);
    expect(draggedState.theta).toBeLessThan(0.28);
    expect(canvas).toHaveAttribute("data-dragging", "true");

    dispatchPointerEvent(canvas, "pointerup", { pointerId: 1 });

    expect(canvas).toHaveAttribute("data-dragging", "false");
  });
});
