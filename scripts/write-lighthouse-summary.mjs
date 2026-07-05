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
  throw new Error("Usage: node scripts/write-lighthouse-summary.mjs baseline|after");
}

const manifestPath = path.join(reportDir, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing Lighthouse CI manifest: ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const hasRepresentativeRuns = manifest.some(
  (entry) => entry.isRepresentativeRun === true,
);
const entries = hasRepresentativeRuns
  ? manifest.filter((entry) => entry.isRepresentativeRun === true)
  : manifest;

const resolveReportPath = (reportPath) => {
  if (path.isAbsolute(reportPath)) {
    return reportPath;
  }

  const fromRoot = path.resolve(rootDir, reportPath);
  if (fs.existsSync(fromRoot)) {
    return fromRoot;
  }

  return path.resolve(reportDir, path.basename(reportPath));
};

const score = (value) =>
  typeof value === "number" ? Math.round(value * 100) : null;

const metric = (audit) => ({
  numericValue:
    typeof audit?.numericValue === "number"
      ? Math.round(audit.numericValue)
      : null,
  displayValue: audit?.displayValue ?? "",
});

const rows = entries.map((entry) => {
  const jsonPath = resolveReportPath(entry.jsonPath);
  const lhr = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const url = new URL(entry.url);
  const lcp = metric(lhr.audits["largest-contentful-paint"]);
  const clsAudit = lhr.audits["cumulative-layout-shift"];
  const cls =
    typeof clsAudit?.numericValue === "number"
      ? Number(clsAudit.numericValue.toFixed(3))
      : null;

  return {
    route: `${url.pathname}${url.search}`,
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

const measuredPorts = [
  ...new Set(
    rows.map((row) => {
      const url = new URL(row.url);
      return url.port || (url.protocol === "https:" ? "443" : "80");
    }),
  ),
];
const measuredPortLabel =
  measuredPorts.length === 1
    ? `port \`${measuredPorts[0]}\``
    : `ports ${measuredPorts.map((port) => `\`${port}\``).join(", ")}`;

fs.mkdirSync(resultsDir, { recursive: true });

const jsonOutputPath = path.join(resultsDir, `${runDate}-${mode}.json`);
fs.writeFileSync(
  jsonOutputPath,
  `${JSON.stringify({ mode, runDate, rows }, null, 2)}\n`,
);

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
          row.lcpMs !== null &&
          (row.lcpMs <= 2500 || lcpDelta <= 0)
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

const markdown = `# ${runDate} ${
  mode === "baseline"
    ? "Performance Baseline"
    : "Performance After-Implementation Check"
}

## Context

- Environment: local production build served with \`next start\` on ${measuredPortLabel}.
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
