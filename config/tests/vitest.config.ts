import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default", ["junit", { outputFile: "reports/vitest/report.xml" }]],
    setupFiles: ["config/tests/vitest-setup.config.ts"],
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: { disableCSSFileLoading: true },
      },
    },
    isolate: true,
    pool: "forks",
  },
});
