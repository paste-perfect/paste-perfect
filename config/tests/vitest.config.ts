import path, { resolve } from "path";
import { defineConfig } from "vitest/config";

const REPO_ROOT = path.resolve(__dirname, "../../");

export default defineConfig({
  test: {
    reporters: ["default", ["junit", { outputFile: "reports/vitest/report.xml" }]],
    setupFiles: ["src/tests/unit-tests/vitest-setup.config.ts"],
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true, // Prevents Happy DOM from fetching <link> stylesheets
        },
      },
    },
    // Reset all mocks/spies and module registry between tests.
    clearMocks: true,
    mockReset: true, // resets implementations too — prevents cross-test leakage
    restoreMocks: true, // restores original (un-spied) implementations
    unstubEnvs: true,
    unstubGlobals: true,
    isolate: true,
    pool: "forks",
  },
  resolve: {
    alias: [
      {
        find: /(^|\/)src\/app\/constants\/languages(\.ts)?$/,
        replacement: resolve(REPO_ROOT, "src/tests/unit-tests/languages-mock.ts"),
      },
    ],
  },
});
