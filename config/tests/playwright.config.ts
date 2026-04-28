import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestConfig } from "@playwright/test";
import path from "path";
import env from "./playwright.env-vars";
import fs from "fs";

// ---------------------------------------------------------------------------
// Paths & URLs
// ---------------------------------------------------------------------------

const WEB_SERVER_PORT = env.WEBSERVER_PORT;
const REACH_HOST = env.USE_DOCKER_HOST_WEBSERVER ? "host.docker.internal" : "127.0.0.1";
const BASE_URL = env.PLAYWRIGHT_BASE_URL || `http://${REACH_HOST}:${WEB_SERVER_PORT}/paste-perfect/`;

const REPO_ROOT = path.resolve(__dirname, "../../");
const TEST_DIR = path.join(REPO_ROOT, "src/tests/snapshot-tests");

if (!fs.existsSync(REPO_ROOT)) {
  throw new Error(`\n❌ CRITICAL ERROR: Repository root directory not found at: ${REPO_ROOT}\n`);
}
if (!fs.existsSync(TEST_DIR)) {
  throw new Error(
    `\n❌ CRITICAL ERROR: Test directory not found at: ${TEST_DIR}\n👉 Ensure you are mapping the volumes correctly in docker-compose-new.yml.\n`
  );
}

const HTML_REPORT_DIR = path.join(REPO_ROOT, "reports/playwright/html-report");
const JUNIT_REPORT_FILE = path.join(REPO_ROOT, "reports/playwright/report.xml");
const REPORT_PORT = env.REPORT_PORT;

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

const reporter: PlaywrightTestConfig["reporter"] = [
  [env.CI ? "github" : "list"],
  ["html", { open: "never", host: "0.0.0.0", port: REPORT_PORT, outputFolder: HTML_REPORT_DIR }],
  ...(env.CI ? [["junit", { outputFile: JUNIT_REPORT_FILE }] as [string, object]] : []),
];

// ---------------------------------------------------------------------------
// Web server — skipped when an external server is configured
// ---------------------------------------------------------------------------

const webServer: PlaywrightTestConfig["webServer"] =
  env.PLAYWRIGHT_BASE_URL || env.USE_DOCKER_HOST_WEBSERVER
    ? undefined
    : {
        command: `npm run serve:test -- --host 127.0.0.1 --port ${WEB_SERVER_PORT}`,
        url: BASE_URL,
        cwd: REPO_ROOT,
        reuseExistingServer: !env.CI,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120_000,
      };

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export default defineConfig({
  testDir: TEST_DIR,
  snapshotPathTemplate: "{testDir}/snapshots/{testFileName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: env.CI,
  retries: env.CI ? 1 : 0,
  workers: env.CI ? 1 : undefined,
  reporter,
  globalSetup: "./playwright.global-setup.ts",
  expect: {
    toMatchSnapshot: {
      maxDiffPixels: 0,
      maxDiffPixelRatio: 0,
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    locale: "en-US",
    timezoneId: "UTC",
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    navigationTimeout: 30_000,
    actionTimeout: 5_000,
    launchOptions: {
      args: ["--disable-dev-shm-usage", "--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer,
});
