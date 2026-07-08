export const DEFAULT_BROWSER_ROUTE = "unknown";

export type BrowserEventRuntime = "browser";

export type BrowserEventFieldInput = {
  route?: string | null;
  runtime?: BrowserEventRuntime;
};

export type BrowserEventFields = {
  route: string;
  runtime: BrowserEventRuntime;
};

export const getSafeText = (
  value: string | null | undefined,
): string | undefined => {
  const text = value?.trim();
  return text && text.length > 0 ? text : undefined;
};

export const getCurrentBrowserRoute = (): string => {
  if (typeof window === "undefined") {
    return DEFAULT_BROWSER_ROUTE;
  }

  return window.location.pathname || "/";
};

export const resolveBrowserEventFields = (
  input: BrowserEventFieldInput,
): BrowserEventFields => ({
  route: getSafeText(input.route) ?? getCurrentBrowserRoute(),
  runtime: input.runtime ?? "browser",
});

