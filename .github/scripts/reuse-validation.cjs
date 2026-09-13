const { setTimeout } = require("node:timers/promises");

module.exports = async ({ github, context, core, wait = setTimeout, attempts = 40 }) => {
  const { owner, repo } = context.repo;
  const expected = context.payload.pull_request;
  const assertCurrent = async () => {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: expected.number });
    if (
      pr.head.repo?.full_name !== `${owner}/${repo}` ||
      pr.head.ref !== "dev" ||
      pr.base.ref !== "main" ||
      pr.head.sha !== expected.head.sha
    ) {
      throw new Error("Only the current same-repository dev-to-main head can reuse branch validation.");
    }
    const { data } = await github.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `${pr.base.sha}...${pr.head.sha}` });
    if (data.behind_by !== 0) throw new Error("Sync main back into dev first: the proposed merge is not the validated dev tree.");
  };
  await assertCurrent();
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { data } = await github.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: "ci.yml",
      branch: "dev",
      event: "push",
      head_sha: expected.head.sha,
      per_page: 100,
    });
    const run = data.workflow_runs
      .filter(
        (run) =>
          run.head_sha === expected.head.sha &&
          run.head_branch === "dev" &&
          run.event === "push" &&
          run.head_repository?.full_name === `${owner}/${repo}`
      )
      .sort((a, b) => b.id - a.id)[0];
    if (run?.status === "completed") {
      if (run.conclusion !== "success")
        throw new Error(`Dev CI run ${run.id} is ${run.conclusion}; rerun that push workflow after resolving the failure.`);
      await assertCurrent();
      core.info(`Reused successful dev CI run ${run.id} for ${expected.head.sha}; main is already included in that commit.`);
      core.setOutput("run-id", run.id);
      return;
    }
    if (attempt + 1 < attempts) {
      core.info("Waiting for the dev push validation; no duplicate build or tests are started.");
      await wait(15_000);
    }
  }
  throw new Error("No completed dev push CI found for this commit. Complete or rerun its push workflow.");
};
