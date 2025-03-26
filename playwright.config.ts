import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200/paste-perfect/",
  },
  testDir: "e2e-tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFilePath}/{arg}{ext}",
});
