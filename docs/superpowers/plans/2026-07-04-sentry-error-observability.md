# Sentry Error Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sentry error monitoring to EDMM on a free-plan-safe configuration with error-only Session Replay.

**Architecture:** Sentry is initialized through Next.js App Router instrumentation files for client, server, and edge runtimes. Error capture is wired into the existing App Router error boundaries without changing user-facing product behavior. Session Replay is configured only for sampled error sessions and the DSN is managed through `NEXT_PUBLIC_SENTRY_DSN`.

**Tech Stack:** Next.js 16 App Router, React 19, `@sentry/nextjs`, Jest, Vercel environment variables.

## Global Constraints

- Sentry must be used on the free plan only.
- Use the provided DSN only through `NEXT_PUBLIC_SENTRY_DSN`.
- Do not hard-code the DSN in source files.
- Enable Error Monitoring.
- Enable Tracing with a low production sampling rate: `0.05`.
- Enable Session Replay only for sampled error sessions.
- Disable User Feedback.
- Disable Profiling.
- Disable Sentry Logs.
- Set `replaysSessionSampleRate` to `0`.
- Set `replaysOnErrorSampleRate` to `0.2`.
- Configure Replay privacy with `maskAllText: true`, `maskAllInputs: true`, and `blockAllMedia: true`.
- Set `sendDefaultPii` to `false`.
- Do not upload source maps until `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are explicitly provided.
- Do not add a cookie banner in this plan.
- Do not add user behavior analytics in this plan.
- Official reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

---

## File Structure

- Modify: `package.json` - add `@sentry/nextjs`.
- Modify: `package-lock.json` - lock dependency changes produced by `npm install`.
- Create: `src/shared/lib/sentry/sentryOptions.ts` - shared free-plan-safe Sentry option helpers.
- Create: `src/instrumentation-client.ts` - client-side Sentry initialization and router transition capture.
- Create: `src/sentry.server.config.ts` - Node.js runtime Sentry initialization.
- Create: `src/sentry.edge.config.ts` - Edge runtime Sentry initialization.
- Create: `src/instrumentation.ts` - Next.js instrumentation registration and request error capture.
- Modify: `next.config.ts` - wrap Next config with `withSentryConfig`.
- Modify: `src/app/error.tsx` - capture route-level render errors in Sentry.
- Create: `src/app/global-error.tsx` - capture global App Router errors in Sentry.
- Create: `src/test/ops/sentryOptions.test.ts` - verifies free-plan-safe option defaults.
- Create: `src/test/app/errorSentryCapture.test.tsx` - verifies route-level error capture.
- Create: `docs/observability/sentry-free-plan.md` - setup, verification, and quota guardrail SOP.

---

### Task 1: Add shared Sentry free-plan options

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/shared/lib/sentry/sentryOptions.ts`
- Create: `src/test/ops/sentryOptions.test.ts`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SENTRY_DSN`.
- Produces:
  - `getSentryDsn(): string | undefined`
  - `isSentryEnabled(): boolean`
  - `getSentryTracesSampleRate(): number`
  - `sanitizeSentryEvent(event: Sentry.Event): Sentry.Event | null`
  - `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
  - `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`

- [ ] **Step 1: Install Sentry SDK**

Run:

```bash
npm install @sentry/nextjs
```

Expected: `package.json` and `package-lock.json` include `@sentry/nextjs`.

- [ ] **Step 2: Create shared option helpers**

Create `src/shared/lib/sentry/sentryOptions.ts`:

```ts
import type * as Sentry from "@sentry/nextjs";

export const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = 0;
export const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = 0.2;

export const getSentryDsn = (): string | undefined => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return dsn && dsn.length > 0 ? dsn : undefined;
};

export const isSentryEnabled = (): boolean => Boolean(getSentryDsn());

export const getSentryTracesSampleRate = (): number =>
  process.env.NODE_ENV === "development" ? 1.0 : 0.05;

export const sanitizeSentryEvent = (
  event: Sentry.Event,
): Sentry.Event | null => {
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  if (event.request?.headers) {
    delete event.request.headers;
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  return event;
};
```

- [ ] **Step 3: Write free-plan option tests**

Create `src/test/ops/sentryOptions.test.ts`:

```ts
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
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it("disables Sentry when DSN is missing", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    expect(getSentryDsn()).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
  });

  it("enables Sentry when DSN is present", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://example@o0.ingest.us.sentry.io/1";

    expect(getSentryDsn()).toBe(
      "https://example@o0.ingest.us.sentry.io/1",
    );
    expect(isSentryEnabled()).toBe(true);
  });

  it("uses a low production tracing sample rate", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });

    expect(getSentryTracesSampleRate()).toBe(0.05);
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
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm test -- sentryOptions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/shared/lib/sentry/sentryOptions.ts src/test/ops/sentryOptions.test.ts
git commit -m "chore(observability): add Sentry free-plan options"
```

---

### Task 2: Initialize Sentry for client, server, and edge runtimes

**Files:**
- Create: `src/instrumentation-client.ts`
- Create: `src/sentry.server.config.ts`
- Create: `src/sentry.edge.config.ts`
- Create: `src/instrumentation.ts`

**Interfaces:**
- Consumes: helpers from `src/shared/lib/sentry/sentryOptions.ts`.
- Produces: Next.js Sentry initialization for browser, Node.js, and Edge runtimes.

- [ ] **Step 1: Create client initialization**

Create `src/instrumentation-client.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
} from "@/shared/lib/sentry/sentryOptions";

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
```

- [ ] **Step 2: Create server initialization**

Create `src/sentry.server.config.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
} from "@/shared/lib/sentry/sentryOptions";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: isSentryEnabled(),
  sendDefaultPii: false,
  tracesSampleRate: getSentryTracesSampleRate(),
  beforeSend: sanitizeSentryEvent,
});
```

- [ ] **Step 3: Create edge initialization**

Create `src/sentry.edge.config.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryTracesSampleRate,
  isSentryEnabled,
  sanitizeSentryEvent,
} from "@/shared/lib/sentry/sentryOptions";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: isSentryEnabled(),
  sendDefaultPii: false,
  tracesSampleRate: getSentryTracesSampleRate(),
  beforeSend: sanitizeSentryEvent,
});
```

- [ ] **Step 4: Register runtime instrumentation**

Create `src/instrumentation.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 5: Run targeted tests**

Run:

```bash
npm test -- sentryOptions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/instrumentation-client.ts src/sentry.server.config.ts src/sentry.edge.config.ts src/instrumentation.ts
git commit -m "feat(observability): initialize Sentry runtimes"
```

---

### Task 3: Wrap Next.js config with Sentry

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: existing `nextConfig`.
- Produces: Sentry-enhanced Next.js config without source-map upload credentials.

- [ ] **Step 1: Update `next.config.ts` imports**

Change the top of `next.config.ts`:

```ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
```

- [ ] **Step 2: Wrap exported config**

Replace the default export:

```ts
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
```

Expected: `org`, `project`, and `authToken` are not configured in this plan, so source map upload is not part of the free-plan initial setup.

- [ ] **Step 3: Build smoke check**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "chore(observability): wrap Next config with Sentry"
```

---

### Task 4: Capture App Router errors

**Files:**
- Modify: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`
- Create: `src/test/app/errorSentryCapture.test.tsx`

**Interfaces:**
- Consumes: `Sentry.captureException(error)`.
- Produces: route-level and global App Router error capture.

- [ ] **Step 1: Update route-level error boundary**

Modify `src/app/error.tsx` so the effect captures the error in Sentry before logging it:

```tsx
"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/shared/lib/logger";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    logger.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
      <h1 className="text-4xl font-bold mb-4">문제가 발생했습니다.</h1>
      <p className="text-neutral-400 mb-8">
        예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors"
      >
        다시 시도하기
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add global error boundary**

Create `src/app/global-error.tsx`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Write route error capture test**

Create `src/test/app/errorSentryCapture.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";
import Error from "@/app/error";

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
    const error = new Error("route failed");

    render(<Error error={error} reset={jest.fn()} />);

    await waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
    expect(screen.getByRole("button", { name: "다시 시도하기" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm test -- errorSentryCapture.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/error.tsx src/app/global-error.tsx src/test/app/errorSentryCapture.test.tsx
git commit -m "feat(observability): capture App Router errors in Sentry"
```

---

### Task 5: Document Sentry free-plan operation

**Files:**
- Create: `docs/observability/sentry-free-plan.md`

**Interfaces:**
- Consumes: Sentry configuration from Tasks 1-4.
- Produces: operating procedure for Vercel environment setup, verification, and quota protection.

- [ ] **Step 1: Create SOP document**

Create `docs/observability/sentry-free-plan.md`:

```md
# Sentry Free-Plan Observability SOP

## Scope

EDMM uses Sentry for free-plan-safe error monitoring with error-only Session Replay.

## Vercel Environment Variable

Set this value in the Vercel project:

`NEXT_PUBLIC_SENTRY_DSN=https://db19876b95d69420736d17e300512dfd@o4511675546664960.ingest.us.sentry.io/4511675552038912`

## Enabled

- Client-side error monitoring
- Server-side error monitoring
- Edge runtime error monitoring
- Low-sample tracing
- Error-only Session Replay

## Disabled

- Full-session Session Replay
- User Feedback
- Profiling
- Sentry Logs
- Source map upload
- Default PII collection

## Sampling

| Signal | Development | Production |
| --- | ---: | ---: |
| Tracing | 1.0 | 0.05 |
| Session Replay for normal sessions | 0 | 0 |
| Session Replay for error sessions | 0.2 | 0.2 |

## Verification

1. Confirm `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel.
2. Deploy to Vercel.
3. Trigger a controlled route-level error in a non-production branch or preview deployment.
4. Confirm the issue appears in Sentry.
5. Confirm a replay is attached only when the error session is sampled.
6. Confirm no replay is created for normal non-error browsing.
7. Confirm event payloads do not include cookies, request headers, email, username, or IP address.

## PASS Criteria

- Sentry receives a controlled client error from the deployed app.
- Sentry receives server/request errors through Next.js instrumentation.
- Normal sessions are not replayed.
- Error sessions are replayed only at the `0.2` sample rate.
- No User Feedback widget appears.
- No default PII is sent.
- Production tracing sample rate is `0.05`.

## BLOCKED Criteria

- Sentry does not receive controlled errors.
- DSN is missing in Vercel.
- Event payload contains cookies, authorization headers, email, username, or IP address.
- Full-session Session Replay, User Feedback, Logs, or Profiling are enabled without explicit approval.
- Source map upload is attempted without `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
```

- [ ] **Step 2: Check the document for forbidden placeholders**

Run:

```bash
rg -n "TBD|TODO|fill in|later" docs/observability/sentry-free-plan.md
```

Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add docs/observability/sentry-free-plan.md
git commit -m "docs(observability): add Sentry free-plan SOP"
```

---

## Self-Review

**Spec coverage:** The plan covers free-plan-only usage, DSN environment handling, client/server/edge setup, App Router error capture, privacy guardrails, low tracing sample rate, error-only Session Replay, and disabled costly features.

**Scope check:** Source map upload, full-session Session Replay, User Feedback, Logs, Profiling, cookie banners, and product analytics are explicitly excluded.

**Placeholder scan:** The plan contains no `TBD`, `TODO`, `fill in`, or unspecified tool choice.

**Type consistency:** `sentryOptions.ts` defines helpers used by all runtime initialization files. App Router error capture uses `Sentry.captureException(error)` consistently.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-sentry-error-observability.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
