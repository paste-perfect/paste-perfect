import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { version } = require("@playwright/test/package.json");
const ui = process.argv.includes("--ui");
const args = process.argv.slice(2).filter((arg) => arg !== "--ui");
const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--ipc=host",
    "--mount",
    `type=bind,source=${process.cwd()},target=/app`,
    "--mount",
    "type=volume,target=/app/node_modules",
    "--workdir",
    "/app",
    "--env",
    `CI=${process.env.CI || "false"}`,
    ...(ui ? ["--publish", "43008:43008"] : []),
    `mcr.microsoft.com/playwright:v${version}-noble`,
    "sh",
    "-ec",
    'npm ci --no-audit --fund=false && exec npx playwright test --config=config/tests/playwright.config.ts "$@"',
    "--",
    ...(ui ? ["--ui", "--ui-host=0.0.0.0", "--ui-port=43008"] : []),
    ...args,
  ],
  { stdio: "inherit" }
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
