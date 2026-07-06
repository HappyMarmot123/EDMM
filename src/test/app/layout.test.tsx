import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";

jest.mock("@/app/appProviders", () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

jest.mock("@/app/performanceInsights", () => ({
  PerformanceInsights: () => <div data-testid="performance-insights" />,
}));

describe("RootLayout", () => {
  it("keeps landing outside the persistent app provider shell", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main data-testid="layout-child">Landing</main>
      </RootLayout>
    );

    expect(html).toContain('data-testid="layout-child"');
    expect(html).not.toContain('data-testid="app-providers"');
    expect(html).toContain('data-testid="performance-insights"');
  });
});
