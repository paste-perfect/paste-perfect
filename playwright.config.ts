import { defineConfig } from "@playwright/test";

const HEADLESS = true;

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200/paste-perfect/",
    headless: process.env.CI ? true : HEADLESS, // always headless in CI
  },
  testDir: "e2e-tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFilePath}/{arg}{ext}",
  webServer: {
    command: "npm run serve",
    port: 4200,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
