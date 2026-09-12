import { defineConfig } from "@playwright/test";
import config from "./playwright.config";
import path from "node:path";
export default defineConfig({
  ...config,
  testMatch: /(?:formatter-migrations|code-highlighter-smoke|copy-settings-dialog-opens)\.spec\.ts/,
  ignoreSnapshots: true,
  use: { ...config.use, baseURL: "http://127.0.0.1:4201/paste-perfect/" },
  webServer: {
    command: "node scripts/serve-build.mjs",
    cwd: path.resolve(__dirname, "../.."),
    url: "http://127.0.0.1:4201/paste-perfect/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
