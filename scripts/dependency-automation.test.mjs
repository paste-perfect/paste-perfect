import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const renovate = JSON.parse(read("renovate.json"));
const maintenance = read(".github/workflows/dependency-maintenance.yml");
const [prepare, commit] = maintenance.split(/^ {2}commit:$/m);

test("only the job without PR code receives the App credential", () => {
  // Earlier steps can rewrite later steps' environment (GITHUB_ENV, GITHUB_PATH), so isolation must be per job.
  assert.ok(commit, "the commit job exists");
  assert.doesNotMatch(prepare, /secrets\./);
  assert.doesNotMatch(commit, /\.\/\.github\/actions\/|\bnpm\b|\bnpx\b|\bnode\b/);
  assert.match(commit, /permission-contents: write/);
});

test("maintenance commits are preserved until a rebase is requested", () => {
  // Ignoring the App's commits would let Renovate regenerate the branch on every run and drop them each time.
  assert.equal(renovate.gitIgnoredAuthors, undefined);
  assert.equal(renovate.rebaseLabel ?? "rebase", "rebase");
});

test("Renovate's lock-only npm runs can fetch bundled-dependency tarballs", () => {
  // npm 12 refuses registry tarballs that it unpacks while computing a lock-only tree; CI keeps npm's default policy.
  assert.equal(renovate.npmrc, "allow-remote=all");
  assert.equal(renovate.npmrcMerge, true);
});
