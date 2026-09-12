import { test } from "node:test";
import assert from "node:assert/strict";
import mergeGreen from "../.github/scripts/merge-green.cjs";
import policy from "../.github/scripts/merge-policy.cjs";

function fixture({ behind = 0, mergeError, green = true } = {}) {
  const merges = [];
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
          }))
        : [],
  };
  return { merges, args: { github, readGithub, context: { repo: { owner: "org", repo: "repo" } }, core: { info() {} } } };
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
