import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function stampRelease(dir, { cwd = process.cwd() } = {}) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  const file = join(dir, "deployment.json");
  const metadata = JSON.parse(readFileSync(file, "utf8"));
  if (
    metadata.repository !== "paste-perfect/paste-perfect" ||
    metadata.sha !== git("rev-parse", "HEAD") ||
    !["preview", "production"].includes(metadata.target)
  ) {
    throw new Error("Release metadata must belong to the checked-out deployment commit.");
  }
  // History-only deliveries retain the nearest released version. Production never uses an rc tag.
  const args = ["describe", "--tags", "--match", "v[0-9]*", "--abbrev=0"];
  if (metadata.target === "production") args.push("--exclude", "*-*");
  const version = git(...args, "HEAD");
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error("No valid release tag found for this deployment.");
  writeFileSync(file, JSON.stringify({ ...metadata, version }, null, 2) + "\n");
  console.log(`Deployment ${metadata.sha} displays release ${version}.`);
  return version;
}

if (import.meta.main) stampRelease(process.argv[2]);
