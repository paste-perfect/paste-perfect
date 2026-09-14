import { test } from "node:test";
import assert from "node:assert/strict";
import promotionPolicy from "../.github/scripts/promotion-policy.cjs";

const commit = (sha, parent, otherParents = [], tree = sha) => ({
  sha,
  parents: [parent, ...otherParents].map((sha) => ({ sha })),
  commit: { tree: { sha: tree } },
});
const pull = (sha, overrides = {}) => ({
  number: 1,
  merged_at: "2026-09-13",
  merge_commit_sha: sha,
  title: "build(deps): update dependencies",
  user: { login: "renovate[bot]" },
  labels: [],
  base: { ref: "dev", repo: { full_name: "org/repo" } },
  head: { ref: "renovate/dependencies", repo: { full_name: "org/repo" } },
  ...overrides,
});

function fixture(commits, prs, { pages, total = commits.length } = {}) {
  const comparisons = [];
  const github = {
    paginate: async (_method, { commit_sha }) => (prs[commit_sha] ? [{ number: prs[commit_sha].number }] : []),
    rest: {
      git: { getRef: async () => ({ data: { object: { sha: "main" } } }) },
      repos: {
        compareCommitsWithBasehead: async (request) => {
          comparisons.push(request);
          return { data: { commits: pages ? (pages[request.page - 1] ?? []) : commits, total_commits: total } };
        },
        getCommit: async () => ({ data: { commit: { tree: { sha: "main" } } } }),
        listPullRequestsAssociatedWithCommit() {},
      },
      pulls: { get: async ({ pull_number }) => ({ data: Object.values(prs).find((pr) => pr.number === pull_number) }) },
    },
  };
  return { github, comparisons, args: { github, context: { repo: { owner: "org", repo: "repo" } }, head: commits.at(-1)?.sha ?? "main" } };
}

test("Renovate and explicitly labeled maintenance PRs qualify together", async () => {
  const state = fixture([commit("dependency", "main"), commit("maintenance", "dependency")], {
    dependency: pull("dependency"),
    maintenance: pull("maintenance", {
      number: 2,
      user: { login: "maintainer" },
      labels: [{ name: "lifecycle" }],
      title: "ci: maintain delivery",
    }),
  });
  assert.equal((await promotionPolicy(state.args)).allowed, true);
  assert.equal(state.comparisons[0].basehead, "main...maintenance");
});

test("a feature below a newer dependency update blocks the whole promotion", async () => {
  const state = fixture([commit("feature", "main"), commit("dependency", "feature")], {
    feature: pull("feature", { number: 2, title: "feat: add an editor", user: { login: "maintainer" } }),
    dependency: pull("dependency"),
  });
  assert.equal((await promotionPolicy(state.args)).allowed, false);
});

test("feature PR titles remain manual even when labeled lifecycle", async () => {
  for (const title of ["feat: add an editor", "feat(editor)!: replace editing"]) {
    const state = fixture([commit("feature", "main")], { feature: pull("feature", { title, labels: [{ name: "lifecycle" }] }) });
    assert.equal((await promotionPolicy(state.args)).allowed, false);
  }
});

test("unknown commits, unmerged PRs, wrong bases and impersonated Renovate branches stay manual", async () => {
  const variants = [
    undefined,
    { merged_at: null },
    { base: { ref: "main", repo: { full_name: "org/repo" } } },
    { user: { login: "someone" } },
    { head: { ref: "renovate/update", repo: { full_name: "fork/repo" } } },
    { merge_commit_sha: "not-in-dev" },
  ];
  for (const overrides of variants) {
    const state = fixture([commit("head", "main")], overrides ? { head: pull("head", overrides) } : {});
    assert.equal((await promotionPolicy(state.args)).allowed, false);
  }
});

test("removing a lifecycle label revokes eligibility on the next check", async () => {
  const pr = pull("head", { user: { login: "maintainer" }, labels: [{ name: "lifecycle" }] });
  const state = fixture([commit("head", "main")], { head: pr });
  assert.equal((await promotionPolicy(state.args)).allowed, true);
  pr.labels = [];
  assert.equal((await promotionPolicy(state.args)).allowed, false);
});

test("history-only reverse syncs preserve eligibility without hiding earlier features", async () => {
  const commits = [commit("change", "main"), commit("sync", "change", ["main"], "change")];
  const state = fixture(commits, { change: pull("change") });
  assert.equal((await promotionPolicy(state.args)).allowed, true);
  state.github.rest.pulls.get = async () => ({ data: pull("change", { title: "feat: introduce a feature" }) });
  assert.equal((await promotionPolicy(state.args)).allowed, false);
});

test("merged lifecycle PRs cover migration commits on their side branch", async () => {
  const state = fixture([commit("migration", "main"), commit("merge", "main", ["migration"])], {
    merge: pull("merge", { user: { login: "maintainer" }, labels: [{ name: "lifecycle" }] }),
  });
  assert.equal((await promotionPolicy(state.args)).allowed, true);
});

test("rebase-merged lifecycle PRs cover all their introducing commits", async () => {
  const pr = pull("second", { user: { login: "maintainer" }, labels: [{ name: "lifecycle" }] });
  const state = fixture([commit("first", "main"), commit("second", "first")], { first: pr, second: pr });
  assert.equal((await promotionPolicy(state.args)).allowed, true);
});

test("paginated history is complete and cannot hide an older feature", async () => {
  const older = commit("feature", "main"),
    newer = commit("dependency", "feature");
  const state = fixture(
    [older, newer],
    { feature: pull("feature", { number: 2, title: "feat: add a feature" }), dependency: pull("dependency") },
    { pages: [[older], [newer]] }
  );
  assert.equal((await promotionPolicy(state.args)).allowed, false);
  assert.deepEqual(
    state.comparisons.map((request) => request.page),
    [1, 2]
  );
});

test("missing or repeated history pages fail closed", async () => {
  const head = commit("head", "main");
  for (const pages of [[[head]], [[head], [head]]]) {
    const state = fixture([head], { head: pull("head") }, { pages, total: 2 });
    assert.equal((await promotionPolicy(state.args)).allowed, false);
  }
  assert.equal((await promotionPolicy(fixture([], {}).args)).allowed, false);
});
