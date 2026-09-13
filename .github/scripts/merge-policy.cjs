const requiredChecks = [
  "CI Gate",
  "Lint PR Title (Conventional Commits)",
  "Lint & Format",
  "Lockfile Integrity",
  "Build (production)",
  "Unit Tests",
  "Snapshot Tests (Playwright)",
  "Trivy — Filesystem Vulnerability Scan",
];

function eligible(pr) {
  if (pr.draft || pr.state !== "open" || pr.head.repo?.full_name !== pr.base.repo?.full_name) return false;
  if (pr.base.ref === "dev" && pr.head.ref === "automation/main-to-dev-sync") return true;
  if (pr.base.ref === "main" && pr.head.ref === "dev") {
    return pr.body?.includes(`<!-- promotion-head: ${pr.head.sha} -->`) ?? false;
  }
  return pr.base.ref === "dev" && pr.head.ref.startsWith("renovate/") && pr.user.login === "renovate[bot]";
}

function checksPass(checks, statuses, prNumber, requirePreview = false) {
  // Push and PR runs can share names on dev. Require the PR's own validation.
  const latest = new Map();
  const required = new Map();
  for (const check of checks) {
    const prs = check.pull_requests?.map((pr) => pr.number) ?? [];
    const scope = `${check.name}:${check.app?.slug}:${prs.sort((a, b) => a - b).join(",") || "push"}`;
    if (!latest.has(scope)) latest.set(scope, check);
    if ((prNumber === undefined || prs.includes(prNumber)) && !required.has(check.name)) required.set(check.name, check);
  }
  if (
    !requiredChecks.every(
      (name) =>
        required.get(name)?.conclusion === "success" &&
        required.get(name)?.status === "completed" &&
        required.get(name)?.app?.slug === "github-actions"
    )
  )
    return false;
  if ([...latest.values()].some((check) => check.status !== "completed" || !["success", "neutral", "skipped"].includes(check.conclusion)))
    return false;
  const contexts = new Map();
  for (const status of statuses) if (!contexts.has(status.context)) contexts.set(status.context, status);
  if (
    requirePreview &&
    (contexts.get("Preview verified")?.state !== "success" || contexts.get("Preview verified")?.creator?.login !== "github-actions[bot]")
  )
    return false;
  return [...contexts.values()].every((status) => status.state === "success");
}
module.exports = { eligible, checksPass, requiredChecks };
