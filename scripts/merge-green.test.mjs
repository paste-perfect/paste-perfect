import { test } from "node:test";
import assert from "node:assert/strict";
import mergeGreen from "../.github/scripts/merge-green.cjs";
import policy from "../.github/scripts/merge-policy.cjs";

function fixture({ behind = 0, mergeError, updateError, green = true, promotion = false, lifecycle = true } = {}) {
  const merges = [];
  const updates = [];
  const pr = {
    number: 1,
    state: "open",
    draft: false,
    mergeable: true,
    user: { login: "renovate[bot]" },
    base: { ref: promotion ? "main" : "dev", repo: { full_name: "org/repo" } },
    head: { ref: promotion ? "dev" : "renovate/update", sha: "tested-sha", repo: { full_name: "org/repo" } },
    body: "<!-- promotion-head: tested-sha -->",
  };
  const github = {
    paginate: async (method) => (method === github.rest.pulls.list ? [pr, { ...pr, number: 2 }] : [{ number: 42 }]),
    rest: {
      pulls: {
        list: () => {},
        get: async ({ pull_number }) => ({
          data:
            pull_number === 42
              ? {
                  merged_at: "2026-09-13",
                  merge_commit_sha: "tested-sha",
                  title: lifecycle ? "ci: maintain delivery" : "feat: add a feature",
                  user: { login: "maintainer" },
                  labels: [{ name: "lifecycle" }],
                  base: { ref: "dev", repo: { full_name: "org/repo" } },
                  head: { ref: "maintenance" },
                }
              : { ...pr, number: pull_number },
        }),
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
      repos: {
        compareCommitsWithBasehead: async () => ({
          data: {
            behind_by: behind,
            total_commits: 1,
            commits: [{ sha: "tested-sha", parents: [{ sha: "main-sha" }], commit: { tree: { sha: "tree" } } }],
          },
        }),
        listPullRequestsAssociatedWithCommit() {},
      },
      git: { getRef: async () => ({ data: { object: { sha: "main-sha" } } }) },
    },
  };
  const checks = () => {};
  const runs = () => {};
  const readGithub = {
    rest: { checks: { listForRef: checks }, actions: { listWorkflowRunsForRepo: runs }, repos: { listCommitStatusesForRef: () => {} } },
    paginate: async (method) =>
      method === checks
        ? policy.requiredChecks.map((name) => ({
            name,
            status: "completed",
            conclusion: green ? "success" : "failure",
            app: { slug: "github-actions" },
            pull_requests: [{ number: 1 }, { number: 2 }],
            details_url: "https://github.com/org/repo/actions/runs/10/job/100",
          }))
        : method === runs
          ? [{ id: 10, workflow_id: 20, event: "pull_request" }]
          : promotion
            ? [{ context: "Preview verified", state: "success", creator: { login: "github-actions[bot]" } }]
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

test("production rechecks lifecycle eligibility despite a weekly marker and green preview", async () => {
  const feature = fixture({ promotion: true, lifecycle: false });
  await mergeGreen(feature.args);
  assert.deepEqual(feature.merges, []);
  const maintenance = fixture({ promotion: true });
  await mergeGreen(maintenance.args);
  assert.equal(maintenance.merges.length, 1);
  assert.equal(maintenance.merges[0].merge_method, "merge");
});
