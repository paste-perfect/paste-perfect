// Runs once before the test suite — prints a config summary to ease CI debugging.
import { FullConfig } from "@playwright/test";
import env from "./playwright.env-vars";

function logStartup(config: FullConfig): void {
  const ws = Array.isArray(config.webServer) ? config.webServer[0] : (config.webServer ?? undefined);

  const htmlReporter = (config.reporter as Array<[string, unknown]> | undefined)?.find(([name]) => name === "html");
  const htmlOutputFolder = (htmlReporter?.[1] as Record<string, unknown> | undefined)?.["outputFolder"] ?? "(default)";

  console.log("\nStarting Playwright tests:");
  console.log(`  version                         : ${config.version}`);
  console.log(`  CI                              : ${env.CI}`);
  console.log(`  UI mode                         : ${env.UI_MODE}`);
  console.log(`  USE_DOCKER_HOST_WEBSERVER       : ${env.USE_DOCKER_HOST_WEBSERVER}`);
  console.log(`  FILE_CHANGES_DETECTION_SUPPORTED: ${env.FILE_CHANGES_DETECTION_SUPPORTED}`);
  console.log(`  WEBSERVER_PORT                  : ${env.WEBSERVER_PORT}`);
  console.log(`  REPORT_PORT                     : ${env.REPORT_PORT}`);
  console.log(`  Update snapshots                : ${config.updateSnapshots}`);
  console.log(`  webServer.command               : ${ws?.command ?? "(none — external server)"}`);
  console.log(`  webServer.url                   : ${ws?.url ?? "(none)"}`);
  console.log(`  webServer.reuseExistingServer   : ${ws?.reuseExistingServer ?? "(n/a)"}`);
  console.log(`  testDir                         : ${config.projects[0]?.testDir ?? "(unknown)"}`);
  console.log(`  outputDir                       : ${config.projects[0]?.outputDir ?? "(unknown)"}`);
  console.log(`  html reporter outputFolder      : ${htmlOutputFolder}\n`);
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  logStartup(config);
}
