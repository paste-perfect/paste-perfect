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
  // History-only deliveries retain the nearest released version, taken from the channel the
  // target publishes on. Production never shows an rc; preview never shows a stable tag, which
  // a reverse sync otherwise parks closer to HEAD than the last rc.
  const describe = (...args) => {
    try {
      return git("describe", "--tags", "--abbrev=0", ...args, "HEAD");
    } catch {
      return "";
    }
  };
  const version =
    metadata.target === "production"
      ? describe("--match", "v[0-9]*", "--exclude", "*-*")
      : describe("--match", "v[0-9]*-*") || describe("--match", "v[0-9]*");
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error("No valid release tag found for this deployment.");
  writeFileSync(file, JSON.stringify({ ...metadata, version }, null, 2) + "\n");
  console.log(`Deployment ${metadata.sha} displays release ${version}.`);
  return version;
}

if (import.meta.main) stampRelease(process.argv[2]);
