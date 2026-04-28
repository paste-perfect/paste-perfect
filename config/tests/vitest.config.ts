import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default", ["junit", { outputFile: "reports/vitest/report.xml" }]],
    setupFiles: ["config/tests/vitest-setup.config.ts"],
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
    alias: {
      "@components": "/src/app/components",
      "@constants": "/src/app/constants/index",
      "@package.json": "/package.json",
      "@services": "/src/app/services",
      "@types": "/src/app/types/index",
      "@utils": "/src/app/utils",
    },
  },
});
