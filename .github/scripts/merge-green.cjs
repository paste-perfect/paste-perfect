const { eligible, checksPass } = require("./merge-policy.cjs");

module.exports = async ({ github, readGithub = github, context, core }) => {
  const { owner, repo } = context.repo;
  const prs = await github.paginate(github.rest.pulls.list, { owner, repo, state: "open", per_page: 100 });
  for (const candidate of prs) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: candidate.number });
    if (!eligible(pr)) continue;
    const checks = await readGithub.paginate(readGithub.rest.checks.listForRef, { owner, repo, ref: pr.head.sha, per_page: 100 });
    const statuses = await readGithub.paginate(readGithub.rest.repos.listCommitStatusesForRef, {
      owner,
      repo,
      ref: pr.head.sha,
      per_page: 100,
    });
    if (!checksPass(checks, statuses)) continue;
    const { data: comparison } = await github.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${pr.base.ref}...${pr.head.sha}`,
    });
    if (comparison.behind_by || pr.mergeable !== true) {
      core.info(`#${pr.number} needs a base update or conflict resolution.`);
      continue;
    }
    // Use the expected head SHA and protected branches; never bypass required checks.
    try {
      const { data } = await github.rest.pulls.merge({
        owner,
        repo,
        pull_number: pr.number,
        sha: pr.head.sha,
        merge_method: pr.head.ref.startsWith("renovate/") ? "squash" : "merge",
      });
      core.info(`#${pr.number}: ${data.message}`);
      if (data.merged) break; // Remaining PRs must validate against the new base first.
    } catch (error) {
      if (![405, 409].includes(error.status)) throw error;
      core.info(`#${pr.number} is no longer mergeable: ${error.message}`);
    }
  }
};
