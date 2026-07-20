import { render, screen } from "@testing-library/react";
import type { SyncedLyricsDocument } from "@/shared/lib/lyrics";
import FullscreenLyricsPanel from "../components/fullscreenLyricsPanel";

const document: SyncedLyricsDocument = {
  trackId: "cloudinary:asset-1",
  source: "lrclib",
  providerId: 42,
  instrumental: false,
  durationMs: 10_000,
  lines: [
    { startMs: 1_000, endMs: 2_000, text: "First line" },
    { startMs: 2_500, endMs: 4_000, text: "Second line" },
  ],
};

const scrollIntoView = jest.fn();

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

beforeEach(() => {
  scrollIntoView.mockClear();
});

const renderPanel = (
  props: Partial<React.ComponentProps<typeof FullscreenLyricsPanel>> = {},
) => {
  return render(
    <FullscreenLyricsPanel
      queryState="success"
      document={document}
      currentTimeSeconds={1.5}
      {...props}
    />,
  );
};

describe("FullscreenLyricsPanel", () => {
  it.each([
    ["loading", "Loading synchronized lyrics…"],
    ["unavailable", "Synced lyrics aren’t available for this track."],
    ["error", "Lyrics couldn’t be loaded. Playback is still available."],
  ] as const)("renders the %s state", (queryState, copy) => {
    renderPanel({ queryState, document: null });

    expect(screen.getByText(copy)).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders the instrumental state", () => {
    renderPanel({
      document: { ...document, instrumental: true, lines: [] },
    });

    expect(screen.getByText("Instrumental track")).toBeInTheDocument();
  });

  it("renders non-interactive lyric text with one active line and no live region", () => {
    const { container } = renderPanel();
    const first = screen.getByText("First line");
    const second = screen.getByText("Second line");

    expect(first).toHaveAttribute("aria-current", "true");
    expect(second).not.toHaveAttribute("aria-current");
    expect(first).toHaveClass("min-h-11");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.querySelector("[aria-live]")).toBeNull();
  });

  it("uses a non-scrollable bounded window that follows playback without DOM scrolling", () => {
    const longDocument: SyncedLyricsDocument = {
      ...document,
      durationMs: 8_000,
      lines: Array.from({ length: 8 }, (_, index) => ({
        startMs: index * 1_000,
        endMs: (index + 1) * 1_000,
        text: `Line ${index + 1}`,
      })),
    };
    const { rerender } = renderPanel({
      document: longDocument,
      currentTimeSeconds: 0.5,
    });
    const lineWindow = screen.getByTestId("lyrics-line-window");

    expect(lineWindow).toHaveClass("overflow-hidden");
    expect(lineWindow).not.toHaveClass("overflow-y-auto");
    expect(screen.getAllByTestId("lyric-line")).toHaveLength(5);
    expect(screen.getByText("Line 1")).toHaveAttribute("aria-current", "true");
    expect(screen.queryByText("Line 8")).toBeNull();

    rerender(
      <FullscreenLyricsPanel
        queryState="success"
        document={longDocument}
        currentTimeSeconds={5.5}
      />,
    );

    expect(screen.getAllByTestId("lyric-line")).toHaveLength(5);
    expect(screen.queryByText("Line 1")).toBeNull();
    expect(screen.getByText("Line 6")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Line 8")).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("keeps every state in the same glass panel shell and accepts className", () => {
    renderPanel({ queryState: "loading", document: null, className: "test-shell" });

    expect(screen.getByLabelText("Synchronized lyrics")).toHaveClass(
      "test-shell",
      "backdrop-blur-xl",
      "h-[min(34rem,56dvh)]",
    );
  });

  it("fills a parent layout without caller-side style overrides", () => {
    renderPanel({ layout: "fill" });

    const panel = screen.getByLabelText("Synchronized lyrics");
    expect(panel).toHaveClass(
      "h-full",
      "min-h-0",
      "max-w-none",
      "rounded-lg",
    );
    expect(panel).not.toHaveClass(
      "h-[min(34rem,56dvh)]",
      "max-w-[34rem]",
      "rounded-2xl",
    );
  });
});
