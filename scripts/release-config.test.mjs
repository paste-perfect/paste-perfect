import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateNotes } from "@semantic-release/release-notes-generator";
import { analyzeCommits } from "@semantic-release/commit-analyzer";

const config = JSON.parse(readFileSync(new URL("../.releaserc.json", import.meta.url), "utf8"));
const optionsFor = (name) => config.plugins.find(([plugin]) => plugin === name)[1];
const context = {
  cwd: process.cwd(),
  env: {},
  logger: { log() {} },
  options: { repositoryUrl: config.repositoryUrl },
  lastRelease: { version: "1.0.0", gitTag: "v1.0.0" },
  nextRelease: { version: "1.0.1", gitTag: "v1.0.1" },
  commits: [{ hash: "a".repeat(40), message: "fix: preserve clipboard indentation" }],
};

test("the installed preset and writer render release notes together", async () => {
  const notes = await generateNotes(optionsFor("@semantic-release/release-notes-generator"), context);
  assert.match(notes, /Bug Fixes/);
  assert.match(notes, /preserve clipboard indentation/);
  assert.match(notes, /v1\.0\.0\.\.\.v1\.0\.1/);
});

test("CI changes make patch releases while history syncs do not release", async () => {
  for (const [message, expected] of [
    ["ci: validate deployment artifacts", "patch"],
    ["chore(sync): merge main into dev", null],
  ]) {
    assert.equal(await analyzeCommits(optionsFor("@semantic-release/commit-analyzer"), { ...context, commits: [{ message }] }), expected);
  }
});
