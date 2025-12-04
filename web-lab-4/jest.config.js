/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  roots: ["<rootDir>/server/tests"],
  transform: {},
  verbose: false,
  collectCoverage: true,
  collectCoverageFrom: ["server/**/*.js", "!server/tests/**"],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["<rootDir>/server/tests/setup.js"]
};
