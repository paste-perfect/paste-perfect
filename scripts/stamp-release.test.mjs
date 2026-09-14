import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { stampRelease } from "./stamp-release.mjs";

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "paste-perfect-release-"));
  t.after(() => {
    assert.equal(dirname(cwd), tmpdir());
    rmSync(cwd, { recursive: true, force: true });
  });
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--initial-branch=main");
  git("config", "user.name", "Release test");
  git("config", "user.email", "release-test@example.invalid");
  git("commit", "--allow-empty", "-m", "fix: initial release");
  git("tag", "v2.9.4");
  git("commit", "--allow-empty", "-m", "feat: next release");
  git("tag", "v2.10.0-rc.1");
  git("commit", "--allow-empty", "-m", "chore(sync): preserve main history");
  const dir = join(cwd, "site");
  mkdirSync(dir);
  const metadata = {
    repository: "paste-perfect/paste-perfect",
    sha: git("rev-parse", "HEAD"),
    target: "preview",
    base: "/paste-perfect-test/",
  };
  const write = (extra = {}) => writeFileSync(join(dir, "deployment.json"), JSON.stringify({ ...metadata, ...extra }));
  return { cwd, git, dir, metadata, write };
}

test("history-only preview deployments retain the released rc tag and exact source SHA", (t) => {
  const state = fixture(t);
  state.write();
  assert.equal(stampRelease(state.dir, state), "v2.10.0-rc.1");
  const stamped = JSON.parse(readFileSync(join(state.dir, "deployment.json"), "utf8"));
  assert.equal(stamped.sha, state.metadata.sha);
  assert.equal(stamped.version, "v2.10.0-rc.1");
});
test("production selects stable tags, including a newly published release", (t) => {
  const state = fixture(t);
  state.write({ target: "production", base: "/paste-perfect/" });
  assert.equal(stampRelease(state.dir, state), "v2.9.4");
  state.git("tag", "v2.10.0");
  assert.equal(stampRelease(state.dir, state), "v2.10.0");
});
test("metadata from another source commit cannot be stamped for deployment", (t) => {
  const state = fixture(t);
  state.write({ sha: "wrong" });
  assert.throws(() => stampRelease(state.dir, state), /checked-out deployment commit/);
});
