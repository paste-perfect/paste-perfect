import { test } from "node:test";
import assert from "node:assert/strict";
import mergeGreen from "../.github/scripts/merge-green.cjs";
import policy from "../.github/scripts/merge-policy.cjs";

function fixture({ behind = 0, mergeError, updateError, green = true } = {}) {
  const merges = [];
  const updates = [];
  const pr = {
    number: 1,
    state: "open",
    draft: false,
    mergeable: true,
    user: { login: "renovate[bot]" },
    base: { ref: "dev", repo: { full_name: "org/repo" } },
    head: { ref: "renovate/update", sha: "tested-sha", repo: { full_name: "org/repo" } },
  };
  const github = {
    paginate: async () => [pr, { ...pr, number: 2 }],
    rest: {
      pulls: {
        list: () => {},
        get: async ({ pull_number }) => ({ data: { ...pr, number: pull_number } }),
        updateBranch: async (request) => {
          updates.push(request);
          if (updateError) throw Object.assign(new Error("Cannot update branch"), { status: updateError });
        },
        merge: async (request) => {
          merges.push(request);
          if (mergeError) throw Object.assign(new Error("Branch changed"), { status: mergeError });
          return { data: { merged: true, message: "Merged" } };
        },
      },
      repos: { compareCommitsWithBasehead: async () => ({ data: { behind_by: behind } }) },
    },
  };
  const checks = () => {};
  const readGithub = {
    rest: { checks: { listForRef: checks }, repos: { listCommitStatusesForRef: () => {} } },
    paginate: async (method) =>
      method === checks
        ? policy.requiredChecks.map((name) => ({
            name,
            status: "completed",
            conclusion: green ? "success" : "failure",
            app: { slug: "github-actions" },
            pull_requests: [{ number: 1 }, { number: 2 }],
          }))
        : [],
  };
  return {
    merges,
    updates,
    args: { github, readGithub, context: { repo: { owner: "org", repo: "repo" } }, core: { info() {}, warning() {} } },
  };
}

test("uses the read-only client for checks and merges only one validated head", async () => {
  const { args, merges } = fixture();
  await mergeGreen(args);
  assert.equal(merges.length, 1);
  assert.equal(merges[0].sha, "tested-sha");
  assert.equal(merges[0].merge_method, "squash");
});

test("outdated branches and failed checks are never submitted for merging", async () => {
  for (const options of [{ behind: 1 }, { green: false }]) {
    const { args, merges } = fixture(options);
    await mergeGreen(args);
    assert.deepEqual(merges, []);
  }
});

test("a changed head is left unmerged, but permission failures remain visible", async () => {
  await mergeGreen(fixture({ mergeError: 409 }).args);
  await assert.rejects(mergeGreen(fixture({ mergeError: 403 }).args), { status: 403 });
});

test("refreshes outdated Renovate branches even when old checks failed", async () => {
  const { args, merges, updates } = fixture({ behind: 1, green: false });
  await mergeGreen(args);
  assert.deepEqual(merges, []);
  assert.equal(updates.length, 2);
  assert.deepEqual(updates[0], { owner: "org", repo: "repo", pull_number: 1, expected_head_sha: "tested-sha" });
});

test("branch update conflicts never merge and permission errors remain visible", async () => {
  for (const updateError of [405, 409, 422]) {
    const { args, merges } = fixture({ behind: 1, updateError });
    await mergeGreen(args);
    assert.deepEqual(merges, []);
  }
  await assert.rejects(mergeGreen(fixture({ behind: 1, updateError: 403 }).args), { status: 403 });
});
