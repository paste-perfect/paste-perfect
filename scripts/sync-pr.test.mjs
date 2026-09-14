import { test } from "node:test";
import assert from "node:assert/strict";
import syncPr from "../.github/scripts/sync-pr.cjs";

const syncBranch = "automation/main-to-dev-sync";

function fixture({
  reverse = false,
  forward = true,
  existing = false,
  conflict = false,
  lifecycle = true,
  missing = false,
  unreadable = 0,
} = {}) {
  const created = [],
    updated = [],
    merged = [],
    refs = [];
  let unreadableLeft = unreadable;
  const github = {
    paginate: async () => [{ number: 8 }],
    rest: {
      repos: {
        compareCommitsWithBasehead: async ({ basehead }) => ({
          data: {
            ahead_by: (basehead === "dev...main" ? reverse : forward) ? 1 : 0,
            files: forward ? [{ filename: "file" }] : [],
            total_commits: 1,
            commits: [{ sha: "current-dev-sha", parents: [{ sha: "main-sha" }], commit: { tree: { sha: "dev-tree" } } }],
          },
        }),
        merge: async ({ head }) => {
          if (conflict) throw Object.assign(new Error("Merge conflict"), { status: 409 });
          if (unreadableLeft-- > 0) throw Object.assign(new Error("Base does not exist"), { status: 404 });
          merged.push(head);
        },
        listPullRequestsAssociatedWithCommit() {},
      },
      git: {
        getRef: async ({ ref }) => {
          if (missing && ref === `heads/${syncBranch}` && !refs.length) throw Object.assign(new Error("Not Found"), { status: 404 });
          return { data: { object: { sha: ref === "heads/main" ? "main-sha" : "current-dev-sha" } } };
        },
        createRef: async (request) => {
          refs.push(request);
        },
      },
      pulls: {
        get: async () => ({
          data: {
            merged_at: "2026-09-13",
            merge_commit_sha: "current-dev-sha",
            title: lifecycle ? "build(deps): update dependencies" : "feat: introduce a feature",
            user: { login: "renovate[bot]" },
            labels: [],
            head: { ref: "renovate/update", repo: { full_name: "org/repo" } },
            base: { ref: "dev", repo: { full_name: "org/repo" } },
          },
        }),
        list: async () => ({ data: existing ? [{ number: 7, body: "<!-- promotion-head: current-dev-sha -->" }] : [] }),
        create: async (request) => {
          created.push(request);
          return { data: { number: 7, html_url: "pr/7" } };
        },
        update: async (request) => {
          updated.push(request);
        },
      },
    },
  };
  return { created, updated, merged, refs, args: { github, context: { repo: { owner: "org", repo: "repo" } }, core: { info() {} } } };
}

test("regular runs open a sync PR without authorizing production", async () => {
  const state = fixture();
  await syncPr(state.args);
  assert.equal(state.created[0].head, "dev");
  assert.equal(state.created[0].base, "main");
  assert.equal(state.updated.length, 0);
});

test("weekly runs reuse the open PR and authorize only the current head", async () => {
  const state = fixture({ existing: true });
  await syncPr({ ...state.args, weekly: true });
  assert.equal(state.created.length, 0);
  assert.match(state.updated[0].body, /<!-- promotion-head: current-dev-sha -->/);
});

test("weekly runs leave feature syncs open and remove previous authorization", async () => {
  const state = fixture({ existing: true, lifecycle: false });
  await syncPr({ ...state.args, weekly: true });
  assert.equal(state.created.length, 0);
  assert.doesNotMatch(state.updated[0].body, /<!-- promotion-head:/);
  assert.match(state.updated[0].body, /Automatic promotion blocked:/);
});

test("reverse sync preserves history even when the two trees match", async () => {
  const state = fixture({ reverse: true, forward: false });
  await syncPr(state.args);
  assert.deepEqual(state.merged, ["dev", "main"]);
  assert.equal(state.created[0].head, "automation/main-to-dev-sync");
});

test("conflicts stop promotion without forcing a branch or resolving files", async () => {
  const state = fixture({ reverse: true, conflict: true });
  await assert.rejects(syncPr(state.args), { status: 409 });
  assert.deepEqual(state.created, []);
  assert.deepEqual(state.updated, []);
});

test("identical branches do not create empty PRs", async () => {
  const state = fixture({ forward: false });
  await syncPr({ ...state.args, weekly: true });
  assert.deepEqual(state.created, []);
  assert.deepEqual(state.updated, []);
});

test("a sync branch deleted with the previous PR is recreated without a redundant dev merge", async () => {
  const state = fixture({ reverse: true, forward: false, missing: true });
  await syncPr(state.args);
  assert.deepEqual(state.refs, [{ owner: "org", repo: "repo", ref: `refs/heads/${syncBranch}`, sha: "current-dev-sha" }]);
  assert.deepEqual(state.merged, ["main"]);
  assert.equal(state.created[0].head, syncBranch);
});

test("a recreated sync branch that is not readable yet is retried instead of failing the run", async () => {
  const state = fixture({ reverse: true, forward: false, missing: true, unreadable: 2 });
  const waits = [];
  await syncPr({ ...state.args, wait: async (ms) => void waits.push(ms) });
  assert.deepEqual(state.merged, ["main"]);
  assert.deepEqual(waits, [2000, 2000]);
  assert.equal(state.created[0].head, syncBranch);
});

test("a sync branch that stays unreadable fails without opening a PR", async () => {
  const state = fixture({ reverse: true, forward: false, missing: true, unreadable: 99 });
  await assert.rejects(syncPr({ ...state.args, wait: async () => {}, attempts: 3 }), { status: 404 });
  assert.deepEqual(state.created, []);
  assert.deepEqual(state.merged, []);
});
