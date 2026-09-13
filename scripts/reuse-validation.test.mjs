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
};
function fixture({ runs = [[successfulRun]], behind = 0, changedHead = false, foreign = false } = {}) {
  const outputs = [],
    comparisons = [];
  let reads = 0;
  const pr = { number: 7, head: { sha: "head", ref: "dev", repo: { full_name: "org/repo" } }, base: { ref: "main", sha: "base" } };
  const github = {
    rest: {
      pulls: {
        get: async () => ({
          data: { ...pr, head: { ...pr.head, sha: changedHead ? "new" : "head", repo: { full_name: foreign ? "fork/repo" : "org/repo" } } },
        }),
      },
      repos: {
        compareCommitsWithBasehead: async (request) => {
          comparisons.push(request);
          return { data: { behind_by: typeof behind === "function" ? behind(comparisons.length) : behind } };
        },
      },
      actions: { listWorkflowRuns: async () => ({ data: { workflow_runs: runs[Math.min(reads++, runs.length - 1)] } }) },
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
    await assert.rejects(reuseValidation(state.args), /Dev CI run 11/);
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
    await assert.rejects(reuseValidation(fixture({ runs: [runs] }).args), /No completed dev push CI/);
  }
});
test("diverged bases, changed heads and foreign syncs cannot skip merge validation", async () => {
  for (const options of [{ behind: 1 }, { changedHead: true }, { foreign: true }, { behind: (read) => (read === 2 ? 1 : 0) }]) {
    const state = fixture(options);
    await assert.rejects(reuseValidation(state.args));
    assert.deepEqual(state.outputs, []);
  }
});
