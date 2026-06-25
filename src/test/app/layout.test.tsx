import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  AudioPlayerProvider: () => {
    throw new Error("RootLayout must not mount AudioPlayerProvider");
  },
}));

jest.mock("@/shared/providers/tanstackProvider", () => ({
  TanstackProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tanstack-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("does not initialize the audio provider for the landing route shell", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main data-testid="layout-child">Landing</main>
      </RootLayout>
    );

    expect(html).toContain('data-testid="layout-child"');
    expect(html).not.toContain("audio");
  });
});
