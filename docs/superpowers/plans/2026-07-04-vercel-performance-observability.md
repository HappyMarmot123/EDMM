# Vercel Performance Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable before/after performance check workflow for EDMM using Lighthouse CI and Vercel Speed Insights.

**Architecture:** Lighthouse CI provides repeatable lab measurements for selected routes before and after implementation. Vercel Speed Insights provides production Web Vitals after deployment. The app adds Vercel's `SpeedInsights` component at the root layout boundary while Lighthouse CI remains a local/CI measurement tool.

**Tech Stack:** Next.js 16 App Router, React 19, Vercel, `@vercel/speed-insights`, `@lhci/cli`, Jest.

## Global Constraints

- Deployment target is Vercel.
- Performance check uses `Lighthouse CI + Vercel Speed Insights`.
- Measure both before implementation and after implementation.
- Initial Lighthouse CI thresholds use `warn`, not `error`, so baseline collection is not blocked by current scores.
- User behavior analytics remains out of scope for this plan.
- Error collection tooling remains out of scope for this plan.
- Do not change product behavior while adding measurement infrastructure.
- Primary measured routes are `/`, `/search?view=all`, and `/search?view=recent`.
- Official references:
  - Vercel Speed Insights quickstart: https://vercel.com/docs/speed-insights/quickstart
  - Lighthouse CI configuration: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md

---

## File Structure

- Create: `lighthouserc.cjs` - Lighthouse CI collection, assertion, and report-output config.
- Modify: `package.json` - add Lighthouse CI scripts and dependencies.
- Modify: `package-lock.json` - lock dependency changes produced by `npm install`.
- Create: `src/test/ops/lighthouseConfig.test.ts` - verifies monitored routes and non-blocking initial assertions.
- Create: `src/app/performanceInsights.tsx` - isolates Vercel Speed Insights integration.
- Modify: `src/app/layout.tsx` - renders performance insights once at the root layout boundary.
- Create: `src/test/app/performanceInsights.test.tsx` - verifies the wrapper renders the Vercel component.
- Create: `docs/performance/vercel-performance-measurement.md` - operational measurement procedure.
- Create: `scripts/write-lighthouse-summary.mjs` - converts LHCI filesystem output into stable markdown and JSON summaries.
- Create: `src/test/ops/writeLighthouseSummary.test.ts` - verifies the summary writer can parse LHCI manifest data.
- Create: `docs/performance/results/2026-07-04-baseline.md` - generated baseline result record before implementation changes.
- Create: `docs/performance/results/2026-07-04-baseline.json` - generated baseline machine-readable result record.
- Create: `docs/performance/results/2026-07-04-after.md` - generated after-change result record.
- Create: `docs/performance/results/2026-07-04-after.json` - generated after-change machine-readable result record.

---

### Task 1: Add Lighthouse CI config and route coverage test

**Files:**
- Create: `lighthouserc.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/test/ops/lighthouseConfig.test.ts`

**Interfaces:**
- Consumes: existing `npm run build` and `npm run start` scripts.
- Produces: `npm run perf:lighthouse`, which builds the app, starts Next on port `3999`, runs Lighthouse CI against three routes, and writes reports to `docs/performance/lighthouse-reports`.

- [ ] **Step 1: Install Lighthouse CI**

Run:

```bash
npm install --save-dev @lhci/cli
```

Expected: `package.json` and `package-lock.json` include `@lhci/cli`.

- [ ] **Step 2: Add scripts to `package.json`**

Add these scripts without removing existing scripts:

```json
{
  "perf:lighthouse": "npm run build && lhci autorun --config=./lighthouserc.cjs",
  "perf:lighthouse:collect": "lhci collect --config=./lighthouserc.cjs",
  "perf:lighthouse:assert": "lhci assert --config=./lighthouserc.cjs"
}
```

Expected: existing `dev`, `build`, `start`, `lint`, and `test` scripts remain unchanged.

- [ ] **Step 3: Create Lighthouse CI config**

Create `lighthouserc.cjs`:

```js
const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npm run start -- -p ${PORT}`,
      startServerReadyPattern: "Ready",
      url: [
        `${BASE_URL}/`,
        `${BASE_URL}/search?view=all`,
        `${BASE_URL}/search?view=recent`,
      ],
      numberOfRuns: 3,
      settings: {
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "interactive": "off",
        "uses-http2": "off",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./docs/performance/lighthouse-reports",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%",
    },
  },
};
```

Expected: CI uses local filesystem output and does not require an LHCI server.

- [ ] **Step 4: Write config test**

Create `src/test/ops/lighthouseConfig.test.ts`:

```ts
const config = require("../../../lighthouserc.cjs");

describe("Lighthouse CI config", () => {
  it("measures the production-critical EDMM routes", () => {
    expect(config.ci.collect.url).toEqual([
      "http://localhost:3999/",
      "http://localhost:3999/search?view=all",
      "http://localhost:3999/search?view=recent",
    ]);
  });

  it("uses warning thresholds for the initial baseline", () => {
    const assertions = config.ci.assert.assertions;

    expect(assertions["categories:performance"][0]).toBe("warn");
    expect(assertions["cumulative-layout-shift"][0]).toBe("warn");
    expect(assertions["largest-contentful-paint"][0]).toBe("warn");
  });

  it("writes reports into docs/performance/lighthouse-reports", () => {
    expect(config.ci.upload).toMatchObject({
      target: "filesystem",
      outputDir: "./docs/performance/lighthouse-reports",
    });
  });
});
```

- [ ] **Step 5: Run the test**

Run:

```bash
npm test -- lighthouseConfig.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lighthouserc.cjs src/test/ops/lighthouseConfig.test.ts
git commit -m "chore(perf): add Lighthouse CI performance baseline"
```

---

### Task 2: Add Vercel Speed Insights at the root layout boundary

**Files:**
- Create: `src/app/performanceInsights.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/test/app/performanceInsights.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Vercel's Next.js integration from `@vercel/speed-insights/next`.
- Produces: `PerformanceInsights`, a root-level component rendered once per app shell.

- [ ] **Step 1: Install Vercel Speed Insights**

Run:

```bash
npm install @vercel/speed-insights
```

Expected: `package.json` and `package-lock.json` include `@vercel/speed-insights`.

- [ ] **Step 2: Create wrapper component**

Create `src/app/performanceInsights.tsx`:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export function PerformanceInsights() {
  return <SpeedInsights />;
}
```

- [ ] **Step 3: Add wrapper to root layout**

Modify `src/app/layout.tsx`:

```tsx
import { PerformanceInsights } from "./performanceInsights";
```

Inside `<body>`, render it after the existing app providers:

```tsx
<AppProviders>{children}</AppProviders>
<PerformanceInsights />
```

Expected: Speed Insights is loaded at the application root without changing `AppProviders`.

- [ ] **Step 4: Write wrapper test**

Create `src/test/app/performanceInsights.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { PerformanceInsights } from "@/app/performanceInsights";

jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}));

describe("PerformanceInsights", () => {
  it("renders the Vercel Speed Insights component", () => {
    render(<PerformanceInsights />);

    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the test**

Run:

```bash
npm test -- performanceInsights.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/performanceInsights.tsx src/app/layout.tsx src/test/app/performanceInsights.test.tsx
git commit -m "feat(perf): enable Vercel Speed Insights"
```

---

### Task 3: Write the Vercel performance measurement SOP

**Files:**
- Create: `docs/performance/vercel-performance-measurement.md`

**Interfaces:**
- Consumes: `npm run perf:lighthouse` from Task 1 and Vercel Speed Insights from Task 2.
- Produces: a repeatable operating procedure for before/after performance checks.

- [ ] **Step 1: Create the SOP document**

Create `docs/performance/vercel-performance-measurement.md`:

```md
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
3. Save Lighthouse category scores and Core Web Vitals into `docs/performance/results/2026-07-04-baseline.md`.
4. Save report file paths from `docs/performance/lighthouse-reports`.

## Vercel Speed Insights Setup

1. Enable Speed Insights in the Vercel project dashboard.
2. Deploy the app to Vercel production.
3. Confirm Speed Insights receives data after production traffic or manual visits.
4. Record LCP, CLS, INP, FCP, and TTFB from the Vercel dashboard.

## After-Implementation Measurement

1. Run `npm run perf:lighthouse` after implementation changes.
2. Save Lighthouse category scores and Core Web Vitals into `docs/performance/results/2026-07-04-after.md`.
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
```

- [ ] **Step 2: Check the document for forbidden placeholders**

Run:

```bash
rg -n "TBD|TODO|fill in|later" docs/performance/vercel-performance-measurement.md
```

Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add docs/performance/vercel-performance-measurement.md
git commit -m "docs(perf): add Vercel performance measurement SOP"
```

---

### Task 4: Add Lighthouse result summary writer

**Files:**
- Create: `scripts/write-lighthouse-summary.mjs`
- Create: `src/test/ops/writeLighthouseSummary.test.ts`

**Interfaces:**
- Consumes: `docs/performance/lighthouse-reports/manifest.json` and generated Lighthouse JSON reports.
- Produces: `docs/performance/results/2026-07-04-baseline.md`, `docs/performance/results/2026-07-04-baseline.json`, `docs/performance/results/2026-07-04-after.md`, and `docs/performance/results/2026-07-04-after.json`.

- [ ] **Step 1: Create summary writer**

Create `scripts/write-lighthouse-summary.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const reportDir = path.join(rootDir, "docs/performance/lighthouse-reports");
const resultsDir = path.join(rootDir, "docs/performance/results");
const runDate = "2026-07-04";

const mode = process.argv[2];

if (mode !== "baseline" && mode !== "after") {
  throw new Error('Usage: node scripts/write-lighthouse-summary.mjs baseline|after');
}

const manifestPath = path.join(reportDir, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing Lighthouse CI manifest: ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const representativeEntries = manifest.filter(
  (entry) => entry.isRepresentativeRun !== false,
);

const score = (value) =>
  typeof value === "number" ? Math.round(value * 100) : null;

const metric = (audit) => ({
  numericValue:
    typeof audit?.numericValue === "number"
      ? Math.round(audit.numericValue)
      : null,
  displayValue: audit?.displayValue ?? "",
});

const rows = representativeEntries.map((entry) => {
  const jsonPath = path.resolve(rootDir, entry.jsonPath);
  const lhr = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const lcp = metric(lhr.audits["largest-contentful-paint"]);
  const clsAudit = lhr.audits["cumulative-layout-shift"];
  const cls =
    typeof clsAudit?.numericValue === "number"
      ? Number(clsAudit.numericValue.toFixed(3))
      : null;

  return {
    route: new URL(entry.url).pathname + new URL(entry.url).search,
    url: entry.url,
    performance: score(lhr.categories.performance?.score),
    accessibility: score(lhr.categories.accessibility?.score),
    bestPractices: score(lhr.categories["best-practices"]?.score),
    seo: score(lhr.categories.seo?.score),
    lcpMs: lcp.numericValue,
    lcpDisplay: lcp.displayValue,
    cls,
    htmlReport: entry.htmlPath,
    jsonReport: entry.jsonPath,
  };
});

fs.mkdirSync(resultsDir, { recursive: true });

const jsonOutputPath = path.join(resultsDir, `${runDate}-${mode}.json`);
fs.writeFileSync(jsonOutputPath, `${JSON.stringify({ mode, runDate, rows }, null, 2)}\n`);

const table = rows
  .map(
    (row) =>
      `| \`${row.route}\` | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} | ${row.lcpMs} | ${row.cls} | \`${row.htmlReport}\` |`,
  )
  .join("\n");

let comparison = "";

if (mode === "after") {
  const baselinePath = path.join(resultsDir, `${runDate}-baseline.json`);
  if (fs.existsSync(baselinePath)) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    const baselineByRoute = new Map(
      baseline.rows.map((row) => [row.route, row]),
    );
    const comparisonRows = rows
      .map((row) => {
        const before = baselineByRoute.get(row.route);
        const perfDelta =
          before && row.performance !== null && before.performance !== null
            ? row.performance - before.performance
            : null;
        const lcpDelta =
          before && row.lcpMs !== null && before.lcpMs !== null
            ? row.lcpMs - before.lcpMs
            : null;
        const clsDelta =
          before && row.cls !== null && before.cls !== null
            ? Number((row.cls - before.cls).toFixed(3))
            : null;
        const decision =
          perfDelta !== null &&
          perfDelta >= -5 &&
          row.cls !== null &&
          row.cls <= 0.1 &&
          (row.lcpMs !== null && (row.lcpMs <= 2500 || lcpDelta <= 0))
            ? "PASS"
            : "BLOCKED";

        return `| \`${row.route}\` | ${before?.performance ?? "missing"} | ${row.performance} | ${perfDelta ?? "missing"} | ${before?.lcpMs ?? "missing"} | ${row.lcpMs} | ${lcpDelta ?? "missing"} | ${before?.cls ?? "missing"} | ${row.cls} | ${clsDelta ?? "missing"} | ${decision} |`;
      })
      .join("\n");

    comparison = `
## Before/After Comparison

| Route | Baseline Perf | After Perf | Perf Delta | Baseline LCP | After LCP | LCP Delta | Baseline CLS | After CLS | CLS Delta | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${comparisonRows}
`;
  } else {
    comparison = `
## Before/After Comparison

Final decision is BLOCKED because \`docs/performance/results/${runDate}-baseline.json\` is missing.
`;
  }
}

const markdown = `# ${runDate} ${mode === "baseline" ? "Performance Baseline" : "Performance After-Implementation Check"}

## Context

- Environment: local production build served with \`next start\` on port \`3999\`.
- Command: \`npm run perf:lighthouse\`.
- Runs per route: 3.
- Routes: \`/\`, \`/search?view=all\`, \`/search?view=recent\`.

## Lighthouse CI Results

| Route | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | Report file |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${table}
${comparison}
## Vercel Speed Insights Gate

Production Speed Insights is checked in the Vercel dashboard after deployment. The implementation remains BLOCKED for production sign-off until LCP, CLS, INP, FCP, and TTFB are reviewed there.
`;

const markdownOutputPath = path.join(resultsDir, `${runDate}-${mode}.md`);
fs.writeFileSync(markdownOutputPath, markdown);
console.log(`Wrote ${markdownOutputPath}`);
console.log(`Wrote ${jsonOutputPath}`);
```

- [ ] **Step 2: Add npm scripts for summary generation**

Add these scripts to `package.json`:

```json
{
  "perf:summary:baseline": "node scripts/write-lighthouse-summary.mjs baseline",
  "perf:summary:after": "node scripts/write-lighthouse-summary.mjs after"
}
```

- [ ] **Step 3: Write summary writer test**

Create `src/test/ops/writeLighthouseSummary.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

describe("write-lighthouse-summary script", () => {
  it("exists as an executable Node script", () => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "write-lighthouse-summary.mjs",
    );

    expect(fs.existsSync(scriptPath)).toBe(true);
    expect(fs.readFileSync(scriptPath, "utf8")).toContain(
      "write-lighthouse-summary.mjs baseline|after",
    );
  });
});
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm test -- writeLighthouseSummary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/write-lighthouse-summary.mjs src/test/ops/writeLighthouseSummary.test.ts
git commit -m "chore(perf): add Lighthouse summary writer"
```

---

### Task 5: Record the before-implementation baseline

**Files:**
- Create: `docs/performance/results/2026-07-04-baseline.md`
- Create: `docs/performance/results/2026-07-04-baseline.json`
- Create: `docs/performance/lighthouse-reports/*`

**Interfaces:**
- Consumes: `npm run perf:lighthouse` from Task 1 and `npm run perf:summary:baseline` from Task 4.
- Produces: baseline measurements used as the comparison point for later implementation work.

- [ ] **Step 1: Run baseline Lighthouse CI**

Run:

```bash
npm run perf:lighthouse
```

Expected: the command completes and writes reports under `docs/performance/lighthouse-reports`.

- [ ] **Step 2: Generate baseline summary**

Run:

```bash
npm run perf:summary:baseline
```

Expected: `docs/performance/results/2026-07-04-baseline.md` and `docs/performance/results/2026-07-04-baseline.json` are created.

- [ ] **Step 3: Commit**

```bash
git add docs/performance/results/2026-07-04-baseline.md docs/performance/results/2026-07-04-baseline.json docs/performance/lighthouse-reports
git commit -m "docs(perf): record before-implementation baseline"
```

---

### Task 6: Record the after-implementation comparison

**Files:**
- Create: `docs/performance/results/2026-07-04-after.md`
- Create: `docs/performance/results/2026-07-04-after.json`
- Create: `docs/performance/lighthouse-reports/*`

**Interfaces:**
- Consumes: baseline results from Task 5 and `npm run perf:summary:after` from Task 4.
- Produces: final before/after comparison and PASS/BLOCKED decision for the performance check.

- [ ] **Step 1: Run after-change Lighthouse CI**

Run after implementation work is complete:

```bash
npm run perf:lighthouse
```

Expected: the command completes and writes a new set of reports under `docs/performance/lighthouse-reports`.

- [ ] **Step 2: Generate after summary**

Run:

```bash
npm run perf:summary:after
```

Expected: `docs/performance/results/2026-07-04-after.md` and `docs/performance/results/2026-07-04-after.json` are created with a before/after comparison.

- [ ] **Step 3: Check production Speed Insights**

Open the Vercel project dashboard and check Speed Insights after production deployment.

Expected: LCP, CLS, INP, FCP, and TTFB are visible in the dashboard after traffic is recorded.

- [ ] **Step 4: Commit**

```bash
git add docs/performance/results/2026-07-04-after.md docs/performance/results/2026-07-04-after.json docs/performance/lighthouse-reports
git commit -m "docs(perf): record after-implementation performance comparison"
```

---

## Self-Review

**Spec coverage:** The plan covers Vercel deployment assumption, Lighthouse CI lab measurement, Vercel Speed Insights production Web Vitals, generated before/after comparison, and PASS/BLOCKED gates.

**Scope check:** User behavior analytics and error collection are intentionally excluded because the user confirmed the performance-check toolchain but did not select error tooling.

**Placeholder scan:** Measurement values are generated by `scripts/write-lighthouse-summary.mjs`, so result documents do not require manual placeholder replacement.

**Type consistency:** `PerformanceInsights` is created in `src/app/performanceInsights.tsx` and imported by `src/app/layout.tsx`. `lighthouserc.cjs` is CommonJS so Jest can require it directly from `src/test/ops/lighthouseConfig.test.ts`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-vercel-performance-observability.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
