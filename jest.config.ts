import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets/index.js';

const config: Config = {
  ...createCjsPreset(),

  // ── Setup ─────────────────────────────────────────────────────────────────
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],

  // ── Transform ─────────────────────────────────────────────────────────────
  transform: {
    "^.+\\.(ts|js|mjs|cjs)$": [
      "jest-preset-angular",
      {
        tsconfig: "tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
      },
    ],
  },

  // ── Module resolution ─────────────────────────────────────────────────────
  moduleFileExtensions: ["ts", "js", "mjs", "cjs", "json"],

  // ── Path aliases ──────────────────────────────────────────────────────────
  moduleNameMapper: {
    "^@components/(.*)$": "<rootDir>/src/app/components/$1",
    "^@constants$": "<rootDir>/src/app/constants/index",
    "^@package.json$": "<rootDir>/package.json",
    "^@services/(.*)$": "<rootDir>/src/app/services/$1",
    "^@types$": "<rootDir>/src/app/types/index",
    "^@utils/(.*)$": "<rootDir>/src/app/utils/$1",
  },

  // ── Roots ─────────────────────────────────────────────────────────────────
  roots: ["tests/unit-tests"],

  // ── Coverage ──────────────────────────────────────────────────────────────
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: "reports/jest/coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/app/**/*.ts",
    "!src/app/**/constants/**",
    "!src/app/**/regex/**",
    "!src/app/**/types/**",
  ],
  coverageReporters: ["json", "text", "lcov", "clover"],

  // ── Reporters ─────────────────────────────────────────────────────────────
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "reports/jest", outputName: "report.xml" }],
    ["github-actions", { silent: false }],
    "summary",
  ],
};

export default config;
