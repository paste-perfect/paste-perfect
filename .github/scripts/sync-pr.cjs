const { setTimeout: sleep } = require("node:timers/promises");
const promotionPolicy = require("./promotion-policy.cjs");

module.exports = async ({ github, context, core, weekly = false, wait = sleep, attempts = 5 }) => {
  const { owner, repo } = context.repo;
  // A branch created moments ago can still 404 on the merge API until GitHub replicates the ref.
  const merge = async (base, head, commit_message) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await github.rest.repos.merge({ owner, repo, base, head, commit_message });
      } catch (error) {
        if (error.status !== 404 || attempt >= attempts) throw error;
        core.info(`${base} is not readable yet; retrying the ${head} merge.`);
        await wait(2000);
      }
    }
  };
  const ensure = async (head, base) => {
    const comparison = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `${base}...${head}` });
    if (!comparison.data.ahead_by || (base === "main" && !comparison.data.files?.length)) {
      core.info(`${head} has no changes to promote into ${base}.`);
      return;
    }
    if (base === "dev") {
      const branch = "automation/main-to-dev-sync";
      // Merging the previous sync PR deletes this branch, so recreate it from dev before every reverse sync.
      let recreated = false;
      try {
        await github.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
      } catch (error) {
        if (error.status !== 404) throw error;
        const { data: dev } = await github.rest.git.getRef({ owner, repo, ref: "heads/dev" });
        await github.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: dev.object.sha });
        recreated = true;
      }
      // Preserve both histories. A conflict fails explicitly instead of choosing whole files.
      // A branch just recreated from dev already carries it.
      if (!recreated) await merge(branch, "dev", "chore(sync): update sync branch from dev");
      await merge(branch, "main", "chore(sync): merge main into dev");
      head = branch;
    }
    const { data: headRef } = await github.rest.git.getRef({ owner, repo, ref: `heads/${head}` });
    const { data: existing } = await github.rest.pulls.list({ owner, repo, head: `${owner}:${head}`, base, state: "open" });
    let pr = existing[0];
    const body =
      `Sync ${head} into ${base}. Required checks must pass on the current merge result.\n\n` +
      (base === "main"
        ? "Weekly automatic promotion is limited to Renovate PRs and maintenance PRs labeled lifecycle. Features and unclassified changes require a manual merge. New commits after authorization wait for the next weekly run."
        : "Preserve main history in dev after production promotion. Conflicts require resolution; no files are discarded automatically.");
    if (!pr) {
      ({ data: pr } = await github.rest.pulls.create({ owner, repo, head, base, title: `chore(sync): merge ${head} into ${base}`, body }));
      core.info(`Created ${pr.html_url}`);
    }
    if (weekly && base === "main") {
      const promotion = await promotionPolicy({ github, context, head: headRef.object.sha });
      await github.rest.pulls.update({
        owner,
        repo,
        pull_number: pr.number,
        body: promotion.allowed
          ? `${body}\n\n<!-- promotion-head: ${headRef.object.sha} -->`
          : `${body}\n\nAutomatic promotion blocked: ${promotion.reason}`,
      });
      core.info(promotion.allowed ? `Weekly promotion authorized for ${headRef.object.sha}.` : promotion.reason);
    }
  };
  // Finish the reverse sync first to avoid testing a forward PR against stale history.
  await ensure("main", "dev");
  await ensure("dev", "main");
};
