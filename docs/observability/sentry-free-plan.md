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

## Privacy Guardrails

- `sendDefaultPii` is `false`.
- Replay masks all text.
- Replay masks all inputs.
- Replay blocks all media.
- Sentry events remove request cookies.
- Sentry events remove request headers.
- Sentry events remove email, username, and IP address from user payloads.

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
