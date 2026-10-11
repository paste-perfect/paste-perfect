import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const renovate = JSON.parse(read("renovate.json"));
const maintenance = read(".github/workflows/dependency-maintenance.yml");
const bot = "paste-perfect-releasebot[bot]";

test("Renovate keeps rebasing branches that carry release App commits", () => {
  // The maintenance workflow commits as <user id>+<slug>[bot]; Renovate must not treat those commits as manual edits.
  assert.ok(renovate.gitIgnoredAuthors.some((email) => /^\d+\+/.test(email) && email.endsWith(`+${bot}@users.noreply.github.com`)));
  assert.match(maintenance, new RegExp(`user\\.login == '${bot.replace(/[[\]]/g, "\\$&")}'`));
});

test("Renovate's lock-only npm runs can fetch bundled-dependency tarballs", () => {
  // npm 12 refuses registry tarballs that it unpacks while computing a lock-only tree; CI keeps npm's default policy.
  assert.equal(renovate.npmrc, "allow-remote=all");
  assert.equal(renovate.npmrcMerge, true);
});
