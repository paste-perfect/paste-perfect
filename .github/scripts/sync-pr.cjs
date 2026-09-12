module.exports = async ({ github, context, core, weekly = false }) => {
  const { owner, repo } = context.repo;
  const ensure = async (head, base) => {
    const comparison = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `${base}...${head}` });
    if (!comparison.data.ahead_by || (base === "main" && !comparison.data.files?.length)) {
      core.info(`${head} has no changes to promote into ${base}.`);
      return;
    }
    if (base === "dev") {
      const branch = "automation/main-to-dev-sync";
      try {
        await github.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
      } catch (error) {
        if (error.status !== 404) throw error;
        const { data: dev } = await github.rest.git.getRef({ owner, repo, ref: "heads/dev" });
        await github.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: dev.object.sha });
      }
      // Preserve both histories. A conflict fails explicitly instead of choosing whole files.
      await github.rest.repos.merge({ owner, repo, base: branch, head: "dev", commit_message: "chore(sync): update sync branch from dev" });
      await github.rest.repos.merge({ owner, repo, base: branch, head: "main", commit_message: "chore(sync): merge main into dev" });
      head = branch;
    }
    const { data: headRef } = await github.rest.git.getRef({ owner, repo, ref: `heads/${head}` });
    const { data: existing } = await github.rest.pulls.list({ owner, repo, head: `${owner}:${head}`, base, state: "open" });
    let pr = existing[0];
    const body =
      `Sync ${head} into ${base}. Required checks must pass on the current merge result.\n\n` +
      (base === "main"
        ? "Production promotion is authorized once per week. New commits after that authorization wait for the next weekly run."
        : "Preserve main history in dev after production promotion. Conflicts require resolution; no files are discarded automatically.");
    if (!pr) {
      ({ data: pr } = await github.rest.pulls.create({ owner, repo, head, base, title: `chore(sync): merge ${head} into ${base}`, body }));
      core.info(`Created ${pr.html_url}`);
    }
    if (weekly && base === "main") {
      await github.rest.pulls.update({
        owner,
        repo,
        pull_number: pr.number,
        body: `${body}\n\n<!-- promotion-head: ${headRef.object.sha} -->`,
      });
      core.info(`Weekly promotion authorized for ${headRef.object.sha}.`);
    }
  };
  // Finish the reverse sync first to avoid testing a forward PR against stale history.
  await ensure("main", "dev");
  await ensure("dev", "main");
};
