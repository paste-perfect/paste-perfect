import { test } from "node:test";
import assert from "node:assert/strict";
import reuseValidation from "../.github/scripts/reuse-validation.cjs";

const successfulRun = {
  id: 10,
  head_sha: "head",
  head_branch: "dev",
  event: "push",
  head_repository: { full_name: "org/repo" },
  status: "completed",
  conclusion: "success",
  run_attempt: 1,
};
function fixture({ runs = [[successfulRun]], behind = 0, changedHead = false, changedBase = false, foreign = false } = {}) {
  const outputs = [],
    comparisons = [];
  let reads = 0;
  const pr = { number: 7, head: { sha: "head", ref: "dev", repo: { full_name: "org/repo" } }, base: { ref: "main", sha: "base" } };
  const github = {
    paginate: async (_method, request) => {
      assert.equal(request.attempt_number, 1);
      return [{ name: "CI Gate", status: "completed", conclusion: "failure" }];
    },
    rest: {
      pulls: {
        get: async () => ({
          data: {
            ...pr,
            base: { ...pr.base, sha: changedBase ? "new-base" : pr.base.sha },
            head: { ...pr.head, sha: changedHead ? "new" : "head", repo: { full_name: foreign ? "fork/repo" : "org/repo" } },
          },
        }),
      },
      repos: {
        compareCommitsWithBasehead: async (request) => {
          comparisons.push(request);
          return { data: { behind_by: typeof behind === "function" ? behind(comparisons.length) : behind } };
        },
      },
      actions: {
        listWorkflowRuns: async () => ({ data: { workflow_runs: runs[Math.min(reads++, runs.length - 1)] } }),
        listJobsForWorkflowRunAttempt() {},
      },
    },
  };
  return {
    outputs,
    comparisons,
    args: {
      github,
      context: { repo: { owner: "org", repo: "repo" }, payload: { pull_request: pr } },
      core: { info() {}, setOutput: (...args) => outputs.push(args) },
      wait: async () => {},
      attempts: 3,
    },
  };
}

test("aligned syncs reuse exactly the successful dev push and recheck the base", async () => {
  const state = fixture();
  await reuseValidation(state.args);
  assert.deepEqual(state.outputs, [["run-id", 10]]);
  assert.equal(state.comparisons.length, 2);
  assert.equal(state.comparisons[0].basehead, "base...head");
});
test("pending dev CI is awaited instead of starting another test suite", async () => {
  const state = fixture({ runs: [[{ ...successfulRun, status: "in_progress", conclusion: null }], [successfulRun]] });
  await reuseValidation(state.args);
  assert.deepEqual(state.outputs, [["run-id", 10]]);
});
test("failed or cancelled latest runs cannot be masked by an older success", async () => {
  for (const conclusion of ["failure", "cancelled", "timed_out"]) {
    const state = fixture({ runs: [[successfulRun, { ...successfulRun, id: 11, conclusion }]] });
    await assert.rejects(reuseValidation(state.args), /Validation run 11/);
    assert.deepEqual(state.outputs, []);
  }
});
test("missing, wrong-commit, foreign and manual runs do not authorize reuse", async () => {
  for (const runs of [
    [],
    [{ ...successfulRun, head_sha: "old" }],
    [{ ...successfulRun, head_repository: { full_name: "fork/repo" } }],
    [{ ...successfulRun, event: "workflow_dispatch" }],
  ]) {
    await assert.rejects(reuseValidation(fixture({ runs: [runs] }).args), /No completed code validation/);
  }
});
test("diverged bases, changed heads and foreign syncs cannot skip merge validation", async () => {
  for (const options of [
    { behind: 1 },
    { changedHead: true },
    { changedBase: true },
    { foreign: true },
    { behind: (read) => (read === 2 ? 1 : 0) },
  ]) {
    const state = fixture(options);
    await assert.rejects(reuseValidation(state.args));
    assert.deepEqual(state.outputs, []);
  }
});

const prRun = {
  ...successfulRun,
  head_branch: "fix/example",
  event: "pull_request",
  display_title: "Validation: PR #7 base...head",
};
function metadataFixture(options = {}) {
  const state = fixture({ runs: [[prRun]], ...options });
  const payload = state.args.context.payload;
  payload.pull_request.head.ref = "fix/example";
  payload.pull_request.base.ref = "dev";
  payload.action = "edited";
  payload.changes = { body: { from: "Previous description" } };
  state.args.context.runId = 99;
  return state;
}

test("metadata edits reuse code validation bound to the same PR, head and base", async () => {
  const state = metadataFixture();
  await reuseValidation(state.args);
  assert.deepEqual(state.outputs, [["run-id", 10]]);
  assert.equal(state.comparisons.length, 2);
});

test("metadata edits wait for in-flight code validation", async () => {
  const state = metadataFixture({ runs: [[{ ...prRun, status: "in_progress" }], [prRun]] });
  await reuseValidation(state.args);
  assert.deepEqual(state.outputs, [["run-id", 10]]);
});

test("metadata cannot reuse another PR, base, metadata run or its own run", async () => {
  for (const run of [
    { ...prRun, display_title: "Validation: PR #8 base...head" },
    { ...prRun, display_title: "Validation: PR #7 old-base...head" },
    { ...prRun, display_title: "Metadata: PR #7 base...head" },
    { ...prRun, id: 99 },
  ]) {
    await assert.rejects(reuseValidation(metadataFixture({ runs: [[run]] }).args), /No completed code validation/);
  }
});

test("a failed code retry blocks metadata even when an older run passed", async () => {
  const state = metadataFixture({ runs: [[prRun, { ...prRun, id: 11, conclusion: "failure" }]] });
  await assert.rejects(reuseValidation(state.args), /Validation run 11 is failure/);
});

test("retargeting a normal PR requires code validation", async () => {
  const state = metadataFixture();
  state.args.context.payload.changes.base = { ref: { from: "main" } };
  await assert.rejects(reuseValidation(state.args), /Only sync PRs and metadata edits/);
});

test("correcting a failed title reuses the successful code gate from that exact attempt", async () => {
  const state = metadataFixture({ runs: [[{ ...prRun, conclusion: "failure", run_attempt: 2 }]] });
  state.args.github.paginate = async (_method, request) => {
    assert.equal(request.run_id, prRun.id);
    assert.equal(request.attempt_number, 2);
    return [
      { name: "CI Gate", status: "completed", conclusion: "success" },
      { name: "Validate / Validation result", status: "completed", conclusion: "success" },
      { name: "Lint PR Title (Conventional Commits)", status: "completed", conclusion: "failure" },
    ];
  };
  await reuseValidation(state.args);
  assert.deepEqual(state.outputs, [["run-id", prRun.id]]);
});

test("title recovery cannot hide another failing job or a cancelled code run", async () => {
  for (const conclusion of ["failure", "cancelled"]) {
    const state = metadataFixture({ runs: [[{ ...prRun, conclusion }]] });
    state.args.github.paginate = async () => [
      { name: "CI Gate", status: "completed", conclusion: "success" },
      { name: "Lint PR Title (Conventional Commits)", status: "completed", conclusion: "failure" },
      { name: "Extra validation", status: "completed", conclusion: "failure" },
    ];
    await assert.rejects(reuseValidation(state.args), /Validation run 10/);
  }
});

test("an unexplained failed run cannot be treated as a title-only failure", async () => {
  const state = metadataFixture({ runs: [[{ ...prRun, conclusion: "failure" }]] });
  state.args.github.paginate = async () => [{ name: "CI Gate", status: "completed", conclusion: "success" }];
  await assert.rejects(reuseValidation(state.args), /Validation run 10/);
});
