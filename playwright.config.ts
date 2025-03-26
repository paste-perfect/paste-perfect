import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://localhost:4200",
  },
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFilePath}/{arg}{ext}",
});
