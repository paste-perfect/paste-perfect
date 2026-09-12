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

function checksPass(checks, statuses) {
  // The API returns newest runs first. Ignore superseded attempts of the same check.
  const latest = new Map();
  for (const check of checks) if (!latest.has(check.name)) latest.set(check.name, check);
  if (
    !requiredChecks.every(
      (name) =>
        latest.get(name)?.conclusion === "success" &&
        latest.get(name)?.status === "completed" &&
        latest.get(name)?.app?.slug === "github-actions"
    )
  )
    return false;
  if ([...latest.values()].some((check) => check.status !== "completed" || !["success", "neutral", "skipped"].includes(check.conclusion)))
    return false;
  const contexts = new Map();
  for (const status of statuses) if (!contexts.has(status.context)) contexts.set(status.context, status);
  return [...contexts.values()].every((status) => status.state === "success");
}
module.exports = { eligible, checksPass, requiredChecks };
