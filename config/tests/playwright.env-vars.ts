/** Parses, validates, and normalizes env vars into a typed config object for Playwright. */

function getEnv(key: string, fallback = ""): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

function toBool(key: string): boolean {
  const v = getEnv(key, "false");
  return v === "true" || v === "1";
}

function toNumber(key: string, fallback: string): number {
  const v = getEnv(key, fallback);
  const parsed = Number(v);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`\n❌ CRITICAL ERROR: Environment variable "${key}" must be a valid number. Got: "${v}"\n`);
  }
  return parsed;
}

const playwrightEnv = {
  CI: toBool("CI"),
  USE_DOCKER_HOST_WEBSERVER: toBool("USE_DOCKER_HOST_WEBSERVER"),
  FILE_CHANGES_DETECTION_SUPPORTED: toBool("FILE_CHANGES_DETECTION_SUPPORTED"),

  // PLAYWRIGHT_BASE_URL is explicitly allowed to be empty
  PLAYWRIGHT_BASE_URL: getEnv("PLAYWRIGHT_BASE_URL"),

  // Strict number parsing without fallbacks
  WEBSERVER_PORT: toNumber("WEBSERVER_PORT", "4200"),
  REPORT_PORT: toNumber("REPORT_PORT", "9323"),

  // Derived from CLI args — true when running `--ui` or `--ui-host`
  UI_MODE: process.argv.some((a) => a === "--ui" || a.startsWith("--ui-host")),
};

export default playwrightEnv;
