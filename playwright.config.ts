import { defineConfig, devices } from "@playwright/test";

const HEADLESS = true;
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200/paste-perfect/";

export default defineConfig({
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
        headless: process.env.CI ? true : HEADLESS, // always headless in CI
        launchOptions: {
          args: ["--disable-lcd-text", "--font-rendering-hinting=none"],
        },
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1, // no retina / high-DPI differences
      },
    },
  ],
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  reporter: [["junit", { outputFile: "playwright-report.xml" }], ["github"], ["list"], ["html", { outputFolder: "playwright-report" }]],
  retries: 0,
  testDir: "e2e-tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFileName}/{arg}{ext}",
  use: {
    trace: "on-first-retry",
    launchOptions: {
      timeout: 120 * 1000, // 2 mins
    },
  },
  webServer: {
    command: "npm run serve",
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
  },
  workers: process.env.CI ? 1 : undefined,
});
