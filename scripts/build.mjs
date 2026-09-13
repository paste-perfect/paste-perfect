import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const target = process.argv[2];
const base = { production: "/paste-perfect/", preview: "/paste-perfect-test/", docker: "/" }[target];
if (!base) throw new Error("Expected production, preview or docker build target.");
const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const result = spawnSync(
  process.execPath,
  [
    "node_modules/@angular/cli/bin/ng.js",
    "build",
    "--configuration=production",
    `--base-href=${base}`,
    `--define=BUILD_VERSION=${JSON.stringify(sha.slice(0, 7))}`,
  ],
  { stdio: "inherit" }
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(
  "dist/paste-perfect/browser/deployment.json",
  JSON.stringify({ repository: "paste-perfect/paste-perfect", sha, target, base }, null, 2) + "\n"
);
writeFileSync("dist/paste-perfect/browser/.nojekyll", "");
