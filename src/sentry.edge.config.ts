import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
} from "./shared/lib/sentry/sentryOptions";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: isSentryEnabled(),
  sendDefaultPii: false,
  tracesSampleRate: getSentryTracesSampleRate(),
  beforeSend: sanitizeSentryEvent,
});
