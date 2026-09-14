import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
const tracked = ["@angular/core", "@angular/cli", "angular-eslint", "@openng/optimus-ui"];
const ledgerPath = "config/framework-migrations.json";
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
let changed = false;
for (const name of tracked) {
  const metadata = JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8"));
  const from = ledger[name];
  const to = metadata.version;
  if (from === to) continue;
  if (!from) throw new Error(`Missing migration baseline for ${name}.`);
  if (Number(to.split(".")[0]) - Number(from.split(".")[0]) > 1) throw new Error(`${name} must be upgraded one major version at a time.`);
  if (metadata["ng-update"]?.migrations) {
    const result = spawnSync(
      process.execPath,
      ["node_modules/@angular/cli/bin/ng.js", "update", name, "--migrate-only", `--from=${from}`, `--to=${to}`, "--allow-dirty"],
      { stdio: "inherit" }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  ledger[name] = to;
  changed = true;
}
if (changed) {
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  execFileSync(
    process.execPath,
    ["node_modules/prettier/bin/prettier.cjs", "--write", "src", "config/framework-migrations.json", "tsconfig*.json", "angular.json"],
    { stdio: "inherit" }
  );
}
