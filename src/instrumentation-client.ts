import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
} from "./shared/lib/sentry/sentryOptions";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: isSentryEnabled(),
  sendDefaultPii: false,
  tracesSampleRate: getSentryTracesSampleRate(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  replaysOnErrorSampleRate: SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  beforeSend: sanitizeSentryEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
