/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";

const config: Config = {
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ["/node_modules/"],

  // Automatically clear mock calls and instances before every test
  clearMocks: true,

  // Collect code coverage
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "reports/jest/coverage",
  coverageProvider: "v8",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/app/**/*.ts",
    // Ignore constants, regex and types as there is not much to test
    "!src/app/**/constants/**",
    "!src/app/**/regex/**",
    "!src/app/**/types/**",
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["json", "text", "lcov", "clover"],

  // Where Jest should look for test files
  roots: ["tests/unit-tests"],

  // Transform TypeScript using ts-jest
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },

  // Extensions Jest should care about
  moduleFileExtensions: ["ts", "js"],

  // Map TS path aliases to Jest module paths
  moduleNameMapper: {
    "^@components/(.*)$": "<rootDir>/src/app/components/$1",
    "^@constants$": "<rootDir>/src/app/constants/index",
    "^@package.json$": "<rootDir>/package.json",
    "^@services/(.*)$": "<rootDir>/src/app/services/$1",
    "^@types$": "<rootDir>/src/app/types/index",
    "^@utils/(.*)$": "<rootDir>/src/app/utils/$1",
  },

  // Use jsdom for DOM APIs
  testEnvironment: "jsdom",

  // Use this configuration option to add custom reporters to Jest
  reporters: [
    ["jest-junit", { outputDirectory: "reports/jest", outputName: "report.xml" }],
    ["github-actions", { silent: false }],
    "summary",
  ],
};

export default config;
