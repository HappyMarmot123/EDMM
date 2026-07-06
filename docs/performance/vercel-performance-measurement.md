# Vercel Performance Measurement SOP

## Scope

This procedure measures EDMM performance before and after implementation changes.

## Tools

- Lighthouse CI for repeatable lab measurements.
- Vercel Speed Insights for production Web Vitals.

## Measured Routes

| Route | Reason |
| --- | --- |
| `/` | Landing page and first impression. |
| `/search?view=all` | Main music shell and catalog surface. |
| `/search?view=recent` | Recent plays surface and local-state path. |

## Before-Implementation Baseline

1. Run `npm install`.
2. Run `npm run perf:lighthouse`.
3. Run `npm run perf:summary:baseline`.
4. Review `docs/performance/results/2026-07-04-baseline.md`.
5. Save report file paths from `docs/performance/lighthouse-reports`.

## Vercel Speed Insights Setup

1. Enable Speed Insights in the Vercel project dashboard.
2. Deploy the app to Vercel production.
3. Confirm Speed Insights receives data after production traffic or manual visits.
4. Record LCP, CLS, INP, FCP, and TTFB from the Vercel dashboard.

## After-Implementation Measurement

1. Run `npm run perf:lighthouse` after implementation changes.
2. Run `npm run perf:summary:after`.
3. Compare baseline and after values route by route.
4. Confirm Vercel Speed Insights does not show a regression after deployment.

## PASS Criteria

- Lighthouse performance score does not drop by more than 5 points on any measured route.
- CLS remains at or below `0.1` on measured routes.
- LCP remains at or below `2500ms` on measured routes, or improves from baseline.
- No new severe accessibility, best-practices, or SEO warnings are introduced.
- Vercel Speed Insights does not show a new production Web Vitals regression after deployment.

## BLOCKED Criteria

- Lighthouse CI cannot collect all measured routes.
- Vercel project Speed Insights cannot be enabled.
- Baseline measurement is missing.
- After-implementation measurement is missing.
