/** Parses, validates, and normalizes env vars into a typed config object for Playwright. */

function getEnv(key: string, required = true): string {
  const value = process.env[key]?.trim();
  if (required && !value) {
    throw new Error(
      `\n❌ CRITICAL ERROR: Environment variable "${key}" is missing or empty.\n👉 Please define it in your .env file or ensure Docker Compose sets a default.\n`
    );
  }
  return value || "";
}

function toBool(key: string): boolean {
  const v = getEnv(key, true);
  return v === "true" || v === "1";
}

function toNumber(key: string): number {
  const v = getEnv(key, true);
  const parsed = Number(v);
  if (isNaN(parsed)) {
    throw new Error(`\n❌ CRITICAL ERROR: Environment variable "${key}" must be a valid number. Got: "${v}"\n`);
  }
  return parsed;
}

const playwrightEnv = {
  CI: toBool("CI"),
  USE_DOCKER_HOST_WEBSERVER: toBool("USE_DOCKER_HOST_WEBSERVER"),
  FILE_CHANGES_DETECTION_SUPPORTED: toBool("FILE_CHANGES_DETECTION_SUPPORTED"),

  // PLAYWRIGHT_BASE_URL is explicitly allowed to be empty
  PLAYWRIGHT_BASE_URL: getEnv("PLAYWRIGHT_BASE_URL", false),

  // Strict number parsing without fallbacks
  WEBSERVER_PORT: toNumber("WEBSERVER_PORT"),
  REPORT_PORT: toNumber("REPORT_PORT"),

  // Derived from CLI args — true when running `--ui` or `--ui-host`
  UI_MODE: process.argv.some((a) => a === "--ui" || a.startsWith("--ui-host")),
};

export default playwrightEnv;
