// Inspect the PRs that introduced unreleased changes, not the sync PR's title.
module.exports = async ({ github, context, head }) => {
  const { owner, repo } = context.repo;
  const { data: main } = await github.rest.git.getRef({ owner, repo, ref: "heads/main" });
  const basehead = `${main.object.sha}...${head}`;
  const commits = new Map();
  for (let page = 1; ; page++) {
    const { data } = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead, per_page: 100, page });
    const previousSize = commits.size;
    for (const commit of data.commits ?? []) commits.set(commit.sha, commit);
    if (commits.size === data.total_commits) break;
    if (commits.size === previousSize || !Number.isInteger(data.total_commits) || commits.size > data.total_commits) {
      return { allowed: false, reason: "The complete unreleased history could not be verified." };
    }
  }
  if (!commits.has(head)) return { allowed: false, reason: "There are no verifiable unreleased changes." };
  const pullRequests = new Map();

  // First parents represent changes landed on dev. Side-branch commits belong to their merged PR.
  let sha = head;
  while (commits.has(sha)) {
    const commit = commits.get(sha);
    const parent = commit.parents?.[0]?.sha;
    if (!parent) return { allowed: false, reason: `Commit ${sha.slice(0, 7)} has no verifiable parent.` };
    if (commit.parents.length > 1) {
      const previous = commits.get(parent) ?? (await github.rest.repos.getCommit({ owner, repo, ref: parent })).data;
      // A reverse sync can add ancestry without changing any files.
      if (commit.commit.tree.sha === previous.commit.tree.sha) {
        sha = parent;
        continue;
      }
    }
    const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
      owner,
      repo,
      commit_sha: sha,
      per_page: 100,
    });
    let accepted = false;
    for (const candidate of associated) {
      if (!pullRequests.has(candidate.number)) {
        const { data } = await github.rest.pulls.get({ owner, repo, pull_number: candidate.number });
        pullRequests.set(candidate.number, data);
      }
      const pr = pullRequests.get(candidate.number);
      // Rebase merges have multiple first-parent commits; GitHub identifies their introducing PR.
      if (
        !pr.merged_at ||
        !commits.has(pr.merge_commit_sha) ||
        (commit.parents.length > 1 && pr.merge_commit_sha !== sha) ||
        pr.base.ref !== "dev" ||
        pr.base.repo.full_name !== `${owner}/${repo}`
      )
        continue;
      if (/^feat(?:\([^)]*\))?!?:/i.test(pr.title)) {
        return { allowed: false, reason: `Feature PR #${pr.number} requires manual promotion.` };
      }
      const renovate =
        pr.user.login === "renovate[bot]" && pr.head.ref.startsWith("renovate/") && pr.head.repo?.full_name === pr.base.repo.full_name;
      const lifecycle = pr.labels?.some((label) => label.name === "lifecycle");
      if (renovate || lifecycle) accepted = true;
    }
    if (!accepted) {
      return {
        allowed: false,
        reason: `Commit ${sha.slice(0, 7)} is not from a merged Renovate or lifecycle PR. Review and merge this sync PR manually.`,
      };
    }
    sha = parent;
  }
  return { allowed: true };
};
