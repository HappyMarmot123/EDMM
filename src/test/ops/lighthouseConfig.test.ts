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
