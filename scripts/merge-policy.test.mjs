import { test } from "node:test";
import assert from "node:assert/strict";
import policy from "../.github/scripts/merge-policy.cjs";
const { eligible, checksPass, requiredChecks } = policy;
const pr = (head = "renovate/angular", base = "dev") => ({
  state: "open",
  draft: false,
  user: { login: "renovate[bot]" },
  head: { ref: head, sha: "abc", repo: { full_name: "org/repo" } },
  base: { ref: base, repo: { full_name: "org/repo" } },
});
const green = () => requiredChecks.map((name) => ({ name, status: "completed", conclusion: "success", app: { slug: "github-actions" } }));
test("only authenticated dependency authors and designated sync branches qualify", () => {
  assert.equal(eligible(pr()), true);
  assert.equal(eligible({ ...pr(), user: { login: "someone" } }), false);
  assert.equal(eligible({ ...pr(), draft: true }), false);
  const fork = pr();
  fork.head.repo.full_name = "fork/repo";
  assert.equal(eligible(fork), false);
  assert.equal(eligible(pr("automation/main-to-dev-sync", "dev")), true);
});
test("weekly authorization is bound to the current dev commit", () => {
  const sync = pr("dev", "main");
  assert.equal(eligible(sync), false);
  sync.body = "<!-- promotion-head: abc -->";
  assert.equal(eligible(sync), true);
  sync.head.sha = "def";
  assert.equal(eligible(sync), false);
});
test("missing, failed, cancelled, skipped and pending required checks block merging", () => {
  assert.equal(checksPass([], []), false);
  assert.equal(checksPass(green(), []), true);
  for (const conclusion of ["failure", "cancelled", "skipped", null]) {
    const checks = green();
    checks[0].conclusion = conclusion;
    assert.equal(checksPass(checks, []), false);
  }
  const checks = green();
  checks[0].status = "in_progress";
  assert.equal(checksPass(checks, []), false);
  checks[0] = { ...green()[0], app: { slug: "untrusted" } };
  assert.equal(checksPass(checks, []), false);
});
test("additional failures and pending statuses also block merging", () => {
  assert.equal(checksPass([...green(), { name: "extra", status: "completed", conclusion: "failure" }], []), false);
  assert.equal(checksPass(green(), [{ context: "external", state: "pending" }]), false);
  assert.equal(checksPass(green(), [{ context: "external", state: "success" }]), true);
});
test("merge orchestration cannot block itself while validation failures still block", () => {
  for (const name of ["Merge validated updates", "Authorize weekly promotion"]) {
    const running = { name, status: "in_progress", conclusion: null, app: { slug: "github-actions" } };
    assert.equal(checksPass([...green(), running], []), true);
    assert.equal(
      checksPass([...green(), running, { name: "Preview browser tests", status: "completed", conclusion: "failure" }], []),
      false
    );
    assert.equal(checksPass([...green(), { ...running, app: { slug: "untrusted" } }], []), false);
  }
});
test("a successful retry supersedes the older failed run", () => {
  assert.equal(checksPass([...green(), { ...green()[0], conclusion: "failure" }], []), true);
});

test("production promotion requires a successful deployed preview from Actions", () => {
  const verified = { context: "Preview verified", state: "success", creator: { login: "github-actions[bot]" } };
  assert.equal(checksPass(green(), [], undefined, true), false);
  assert.equal(checksPass(green(), [verified], undefined, true), true);
  assert.equal(checksPass(green(), [{ ...verified, creator: { login: "someone" } }], undefined, true), false);
  for (const state of ["pending", "failure", "error"]) {
    assert.equal(checksPass(green(), [{ ...verified, state }, verified], undefined, true), false);
    assert.equal(checksPass(green(), [verified, { ...verified, state }], undefined, true), true);
  }
});

test("push results cannot authorize a PR or hide its failed checks", () => {
  const prChecks = green().map((check) => ({ ...check, pull_requests: [{ number: 7 }] }));
  assert.equal(checksPass(green(), [], 7), false);
  assert.equal(checksPass([...green(), ...prChecks], [], 7), true);
  prChecks[0].conclusion = "failure";
  assert.equal(checksPass([...green(), ...prChecks], [], 7), false);
});

test("a skipped push title does not mask the PR title, and failed pushes still block", () => {
  const prChecks = green().map((check) => ({ ...check, pull_requests: [{ number: 7 }] }));
  const pushChecks = green();
  pushChecks.find((check) => check.name === "Lint PR Title (Conventional Commits)").conclusion = "skipped";
  assert.equal(checksPass([...pushChecks, ...prChecks], [], 7), true);
  pushChecks[0].conclusion = "failure";
  assert.equal(checksPass([...prChecks, ...pushChecks], [], 7), false);
});
