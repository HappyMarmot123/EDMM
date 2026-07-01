const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(jose|@panva/hkdf-node|uuid|@szmarczak|cacheable-request|normalize-url))",
  ],
  coverageThreshold: {
    global: {
      statements: 78,
      branches: 65,
      functions: 75,
      lines: 80,
    },
  },
};

module.exports = createJestConfig(config);
