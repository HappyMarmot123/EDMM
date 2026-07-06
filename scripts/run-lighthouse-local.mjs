import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const reportDir = path.join(rootDir, "docs/performance/lighthouse-reports");
const profileRootDir = path.join(rootDir, ".tmp-lighthouse-profile");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3999);
const NUMBER_OF_RUNS = Math.max(1, Number(process.env.LIGHTHOUSE_RUNS ?? 3));
const BASE_URL = `http://localhost:${PORT}`;
const routes = ["/", "/search?view=all", "/search?view=recent"];
const onlyCategories = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];
const chromeFlags = [
  "--headless=new",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-sync",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-sandbox",
];

function writeLine(message) {
  process.stdout.write(`${message}\n`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForHttp(url, server, getOutput) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited before ready:\n${getOutput()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until Next has opened the port.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${url}:\n${getOutput()}`);
}

async function startServer() {
  const nextBin = path.join(rootDir, "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: rootDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  const captureOutput = (chunk) => {
    output += chunk.toString();
  };

  server.stdout.on("data", captureOutput);
  server.stderr.on("data", captureOutput);

  await waitForHttp(BASE_URL, server, () => output);

  return server;
}

function stopServer(server) {
  if (!server || server.exitCode !== null) return;

  if (process.platform === "win32" && server.pid) {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  server.kill("SIGTERM");
}

function routeLabel(route) {
  if (route === "/") return "root";

  return route
    .replace(/^\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function timestampLabel() {
  return new Date()
    .toISOString()
    .replace(/\.\d+Z$/, "")
    .replace(/[-:T]/g, "_");
}

function categoryScore(lhr, category) {
  return lhr.categories[category]?.score ?? null;
}

function buildSummary(lhr) {
  return {
    performance: categoryScore(lhr, "performance"),
    accessibility: categoryScore(lhr, "accessibility"),
    "best-practices": categoryScore(lhr, "best-practices"),
    seo: categoryScore(lhr, "seo"),
  };
}

function splitReports(report, lhr) {
  const reports = Array.isArray(report) ? report : [report];
  const htmlReport =
    reports.find((item) => item.trimStart().startsWith("<!DOCTYPE html")) ??
    reports.find((item) => item.includes("<html")) ??
    "";
  const jsonReport =
    reports.find((item) => item.trimStart().startsWith("{")) ??
    `${JSON.stringify(lhr, null, 2)}\n`;

  return { htmlReport, jsonReport };
}

function representativeSample(samples) {
  return [...samples].sort(
    (left, right) =>
      (left.summary.performance ?? 0) - (right.summary.performance ?? 0),
  )[Math.floor(samples.length / 2)];
}

async function runLighthouseSample(url, route, runIndex) {
  const label = `${routeLabel(route)}-${timestampLabel()}-${runIndex + 1}`;
  const userDataDir = path.join(profileRootDir, label);
  fs.mkdirSync(userDataDir, { recursive: true });

  const chrome = await launch({
    chromeFlags,
    userDataDir,
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: ["html", "json"],
      onlyCategories,
      logLevel: "silent",
    });

    if (!result) {
      throw new Error(`Lighthouse returned no result for ${url}`);
    }

    return {
      label,
      report: result.report,
      lhr: result.lhr,
      summary: buildSummary(result.lhr),
    };
  } finally {
    await chrome.kill();
  }
}

async function runRoute(route) {
  const url = `${BASE_URL}${route}`;
  const samples = [];

  for (let runIndex = 0; runIndex < NUMBER_OF_RUNS; runIndex += 1) {
    writeLine(`Lighthouse ${route} run ${runIndex + 1}/${NUMBER_OF_RUNS}`);
    samples.push(await runLighthouseSample(url, route, runIndex));
  }

  const representative = representativeSample(samples);
  const { htmlReport, jsonReport } = splitReports(
    representative.report,
    representative.lhr,
  );
  const htmlPath = path.join(reportDir, `${representative.label}-report.html`);
  const jsonPath = path.join(reportDir, `${representative.label}-report.json`);

  fs.writeFileSync(htmlPath, htmlReport);
  fs.writeFileSync(jsonPath, jsonReport);

  return {
    url,
    isRepresentativeRun: true,
    htmlPath,
    jsonPath,
    summary: representative.summary,
  };
}

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(profileRootDir, { recursive: true });

  const server = await startServer();

  try {
    const manifest = [];

    for (const route of routes) {
      manifest.push(await runRoute(route));
    }

    fs.writeFileSync(
      path.join(reportDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    writeLine(`Wrote ${path.join(reportDir, "manifest.json")}`);
  } finally {
    stopServer(server);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
