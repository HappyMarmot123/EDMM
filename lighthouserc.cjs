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
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        interactive: "off",
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
