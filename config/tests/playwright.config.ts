import { defineConfig, devices } from "@playwright/test";
import { PlaywrightTestConfig } from "playwright/types/test";

// ---------------------------------------------------------------------------
// Constants & Environment Configuration
// ---------------------------------------------------------------------------

export const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:4200/paste-perfect/";
const CI = Boolean(process.env["CI"]);
const REPORT_PORT = Number(process.env["REPORT_PORT"]) || 9324;

const HTML_REPORT_OUTPUT_FOLDER = "../../reports/playwright/html-report";
const JUNIT_REPORT_OUTPUT_FILE = "../../reports/playwright/report.xml";
const SNAPSHOT_PATH_TEMPLATE = "{testDir}/snapshots/{testFileName}/{arg}{ext}";
const TEST_DIR = "../../src/tests/snapshot-tests";
const WEB_SERVER_CWD = "../../";

// ---------------------------------------------------------------------------
// Reporters
// ---------------------------------------------------------------------------

const reporters: PlaywrightTestConfig["reporter"] = [
  [CI ? "github" : "list"],
  [
    "html",
    {
      open: CI ? "never" : "on-failure",
      host: "0.0.0.0",
      port: REPORT_PORT,
      outputFolder: HTML_REPORT_OUTPUT_FOLDER,
    },
  ],
];

if (CI) {
  reporters.push([
    "junit",
    {
      outputFile: JUNIT_REPORT_OUTPUT_FILE,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Playwright Config
// ---------------------------------------------------------------------------

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
  reporter: reporters,
  retries: 0,
  testDir: TEST_DIR,
  snapshotPathTemplate: SNAPSHOT_PATH_TEMPLATE,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    launchOptions: {
      timeout: 120 * 1000,
      args: ["--disable-dev-shm-usage", "--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
    },
    navigationTimeout: 30 * 1000, // 30 seconds for page.goto() etc.
    actionTimeout: 5 * 1000, // 5 seconds for actions (i.e., click, goto)
  },
  webServer: {
    command: "npm run serve:test",
    reuseExistingServer: !CI,
    url: BASE_URL,
    cwd: WEB_SERVER_CWD,
    timeout: 120 * 1000, // 2 minutes to start the dev server
  },
  workers: CI ? 1 : undefined,
});
