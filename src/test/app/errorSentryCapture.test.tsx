import { render, waitFor } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";
import AppError from "@/app/error";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/shared/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("App Router error boundary", () => {
  it("captures route-level errors in Sentry", async () => {
    const error = new globalThis.Error("route failed");

    render(<AppError error={error} reset={jest.fn()} />);

    await waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });
});
