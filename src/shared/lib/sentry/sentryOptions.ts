import type { Event } from "@sentry/nextjs";

export const SENTRY_PRODUCTION_TRACES_SAMPLE_RATE = 0.05;
export const SENTRY_DEVELOPMENT_TRACES_SAMPLE_RATE = 1.0;
export const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = 0;
export const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = 0.2;

export const getSentryDsn = (): string | undefined => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return dsn && dsn.length > 0 ? dsn : undefined;
};

export const isSentryEnabled = (): boolean => Boolean(getSentryDsn());

export const getSentryTracesSampleRate = (
  environment = process.env.NODE_ENV,
): number =>
  environment === "development"
    ? SENTRY_DEVELOPMENT_TRACES_SAMPLE_RATE
    : SENTRY_PRODUCTION_TRACES_SAMPLE_RATE;

export const sanitizeSentryEvent = <TEvent extends Event>(
  event: TEvent,
): TEvent | null => {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  return event;
};
