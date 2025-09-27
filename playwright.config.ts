import { defineConfig, devices } from "@playwright/test";

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200/paste-perfect/";
const CI = Boolean(process.env.CI);

export default defineConfig({
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1, // no retina / high-DPI differences
        locale: "en-US", // Force consistent locale
        timezoneId: "UTC", // Force consistent timezone
      },
    },
  ],
  expect: {
    toMatchSnapshot: {
      maxDiffPixels: 0,
      maxDiffPixelRatio: 0,
    },
  },
  forbidOnly: CI,
  fullyParallel: true,
  reporter: [
    [CI ? "github" : "list"],
    [
      "junit",
      {
        outputFolder: "reports/playwright/report.xml",
      },
    ],
    [
      "html",
      {
        open: CI ? "never" : "on-failure",
        host: "0.0.0.0",
        port: 9323,
        outputFolder: "reports/playwright/html-report",
      },
    ],
  ],
  retries: 0,
  testDir: "tests/snapshot-tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFileName}/{arg}{ext}",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    launchOptions: {
      timeout: 120 * 1000, // 2 mins
    },
    actionTimeout: 5 * 1000, // 5 seconds for actions (i.e., click, goto)
  },
  webServer: {
    command: "npm run serve:test",
    reuseExistingServer: !CI,
    url: BASE_URL,
  },
  workers: CI ? 1 : undefined,
});
