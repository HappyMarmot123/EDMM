import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
} from "@/shared/lib/sentry/sentryOptions";

describe("Sentry free-plan options", () => {
  const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it("disables Sentry when DSN is missing", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    expect(getSentryDsn()).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
  });

  it("enables Sentry when DSN is present", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://example@o0.ingest.us.sentry.io/1";

    expect(getSentryDsn()).toBe("https://example@o0.ingest.us.sentry.io/1");
    expect(isSentryEnabled()).toBe(true);
  });

  it("uses a low production tracing sample rate", () => {
    expect(getSentryTracesSampleRate("production")).toBe(0.05);
  });

  it("uses full tracing in development", () => {
    expect(getSentryTracesSampleRate("development")).toBe(1);
  });

  it("captures replay only for sampled error sessions", () => {
    expect(SENTRY_REPLAYS_SESSION_SAMPLE_RATE).toBe(0);
    expect(SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE).toBe(0.2);
  });

  it("removes request headers, cookies, and user PII", () => {
    const event = sanitizeSentryEvent({
      request: {
        cookies: { session: "secret" },
        headers: { authorization: "Bearer secret" },
      },
      user: {
        email: "user@example.com",
        ip_address: "127.0.0.1",
        username: "user",
      },
    });

    expect(event?.request?.cookies).toBeUndefined();
    expect(event?.request?.headers).toBeUndefined();
    expect(event?.user?.email).toBeUndefined();
    expect(event?.user?.ip_address).toBeUndefined();
    expect(event?.user?.username).toBeUndefined();
  });
});
