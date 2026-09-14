const { setTimeout } = require("node:timers/promises");

module.exports = async ({ github, context, core, wait = setTimeout, attempts = 40 }) => {
  const { owner, repo } = context.repo;
  const expected = context.payload.pull_request;
  const sync = expected.head.ref === "dev" && expected.base.ref === "main";
  const metadata = context.payload.action === "edited" && !context.payload.changes?.base;
  if (!sync && !metadata) throw new Error("Only sync PRs and metadata edits can reuse validation.");
  const validationName = `Validation: PR #${expected.number} ${expected.base.sha}...${expected.head.sha}`;
  const assertCurrent = async () => {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: expected.number });
    if (
      pr.head.repo?.full_name !== `${owner}/${repo}` ||
      pr.head.ref !== expected.head.ref ||
      pr.base.ref !== expected.base.ref ||
      pr.head.sha !== expected.head.sha ||
      pr.base.sha !== expected.base.sha
    ) {
      throw new Error("The PR head or base changed; validate the current revision.");
    }
    const { data } = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `${pr.base.sha}...${pr.head.sha}` });
    if (data.behind_by !== 0) throw new Error("Update the PR branch from its base first; the merge is not the validated tree.");
  };
  await assertCurrent();
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { data } = await github.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: sync ? "ci.yml" : "pull-request.yml",
      branch: expected.head.ref,
      event: sync ? "push" : "pull_request",
      head_sha: expected.head.sha,
      per_page: 100,
    });
    const run = data.workflow_runs
      .filter(
        (run) =>
          run.id !== context.runId &&
          run.head_sha === expected.head.sha &&
          run.head_branch === expected.head.ref &&
          run.event === (sync ? "push" : "pull_request") &&
          run.head_repository?.full_name === `${owner}/${repo}` &&
          (sync || run.display_title === validationName)
      )
      .sort((a, b) => b.id - a.id)[0];
    if (run?.status === "completed") {
      if (run.conclusion !== "success")
        throw new Error(`Validation run ${run.id} is ${run.conclusion}; rerun that validation after resolving the failure.`);
      await assertCurrent();
      core.info(`Reused successful ${sync ? "dev push" : "PR"} validation ${run.id} for ${expected.head.sha}.`);
      core.setOutput("run-id", run.id);
      return;
    }
    if (attempt + 1 < attempts) {
      core.info("Waiting for code validation; no duplicate build or tests are started.");
      await wait(15_000);
    }
  }
  throw new Error("No completed code validation found for this revision. Complete or rerun its code validation workflow.");
};
