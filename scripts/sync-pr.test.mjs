import { test } from "node:test";
import assert from "node:assert/strict";
import syncPr from "../.github/scripts/sync-pr.cjs";

function fixture({ reverse = false, forward = true, existing = false, conflict = false } = {}) {
  const created = [],
    updated = [],
    merged = [];
  const github = {
    rest: {
      repos: {
        compareCommitsWithBasehead: async ({ basehead }) => ({
          data: {
            ahead_by: (basehead === "dev...main" ? reverse : forward) ? 1 : 0,
            files: forward ? [{ filename: "file" }] : [],
          },
        }),
        merge: async ({ head }) => {
          if (conflict) throw Object.assign(new Error("Merge conflict"), { status: 409 });
          merged.push(head);
        },
      },
      git: {
        getRef: async () => ({ data: { object: { sha: "current-dev-sha" } } }),
      },
      pulls: {
        list: async () => ({ data: existing ? [{ number: 7 }] : [] }),
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
  return { created, updated, merged, args: { github, context: { repo: { owner: "org", repo: "repo" } }, core: { info() {} } } };
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
