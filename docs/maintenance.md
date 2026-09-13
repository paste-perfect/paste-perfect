# Release and deployment guide

The source repository owns all dependencies and automation. The test repository contains documentation on **main** and built preview files on **gh-pages**; it has no tooling. Both Pages sites serve **gh-pages** from its root.

## Workflows

| Workflow                                                            | Trigger and responsibility                                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ci.yml](../.github/workflows/ci.yml)                               | PRs, dev/main pushes, merge groups and manual runs. Checks titles, lint, formatting, migrations, lockfiles, unit/browser tests and vulnerabilities; builds production/preview artifacts. **CI Gate** requires all applicable checks to pass.  |
| [migrations.yml](../.github/workflows/migrations.yml)               | Renovate PR changes. Applies framework migrations and commits them through the release App, triggering fresh CI.                                                                                                                              |
| [auto-merge.yml](../.github/workflows/auto-merge.yml)               | Successful CI/delivery, plus retries at **06:15 and 18:15 UTC**. Refreshes outdated Renovate branches, maintains sync PRs and merges eligible, current, green PRs.                                                                            |
| [scheduled-release.yml](../.github/workflows/scheduled-release.yml) | **Sunday, 00:00 UTC**, or manual dispatch. Authorizes the exact dev commit for lifecycle-only production promotion.                                                                                                                           |
| [release.yml](../.github/workflows/release.yml)                     | Successful dev/main push CI. Ignores superseded commits, publishes applicable tags/notes, downloads that CI run's artifact and verifies it before deploying. Dev deploys to test; main to production. Delivery is serialized per environment. |
| [verify-preview.yml](../.github/workflows/verify-preview.yml)       | After preview deployment, hourly at **:37**, or manually. Waits for Pages, checks the deployed commit/assets and tests that revision with its own Node/dependencies. Delivery records **Preview verified** on the exact commit.               |
| [security.yml](../.github/workflows/security.yml)                   | Sunday, **04:00 UTC**, or manually. Publishes a GitHub Security report; CI also has a required vulnerability scan.                                                                                                                            |

## Scripts

[Shared setup](../.github/actions/setup/action.yml) uses the repository's Node version and installs the lockfile consistently across jobs.

| File                                                                                                                  | Responsibility                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [framework-migrations.mjs](../scripts/framework-migrations.mjs)                                                       | Runs framework-provided migrations using [the migration ledger](../config/framework-migrations.json), one major upgrade at a time.                          |
| [build.mjs](../scripts/build.mjs)                                                                                     | Builds the selected target/base path and writes source commit and environment metadata to deployment.json.                                                  |
| [verify-artifact.mjs](../scripts/verify-artifact.mjs)                                                                 | Rejects incorrect source commits, repositories, targets or base paths, and missing entry points.                                                            |
| [verify-deployment.mjs](../scripts/verify-deployment.mjs) / [deployment-policy.mjs](../scripts/deployment-policy.mjs) | Verify live preview metadata, assets and successful dev CI; retry while Pages propagates.                                                                   |
| [sync-pr.cjs](../.github/scripts/sync-pr.cjs)                                                                         | Creates/reuses forward and reverse sync PRs, preserves history and records weekly authorization for one commit. Conflicts stop synchronization.             |
| [promotion-policy.cjs](../.github/scripts/promotion-policy.cjs)                                                       | Inspects unreleased history and originating PRs. Allows Renovate or explicitly labeled lifecycle maintenance; ignores history-only merges.                  |
| [merge-green.cjs](../.github/scripts/merge-green.cjs) / [merge-policy.cjs](../.github/scripts/merge-policy.cjs)       | Check eligibility, fresh PR-specific CI/statuses and production policy immediately before merging the expected commit. Squash Renovate PRs; merge sync PRs. |
| [serve-build.mjs](../scripts/serve-build.mjs) / [playwright-docker.mjs](../scripts/playwright-docker.mjs)             | Serve production artifacts for browser tests and reproduce Linux snapshot tests locally.                                                                    |

## Promotion and versions

Green Renovate PRs merge into **dev** automatically. Failed, pending, missing or stale checks block merging; branch refreshes require fresh checks.

Automatic **dev → main** promotion requires only lifecycle changes, weekly authorization, green PR CI and **Preview verified** for that exact commit. Later commits wait for the next weekly authorization. Apply **lifecycle** to the original maintenance-only PR. Feature (**feat:**) PRs remain manual even if labeled; any feature or unclassified change keeps the whole sync PR open. Labels are rechecked before merging.

Sync PRs are reused while open and recreated for further changes. Main history returns through a checked reverse-sync PR. Dependency ranges, lockfiles and migrations merge together; conflicts require resolution.

[.releaserc.json](../.releaserc.json) publishes **rc** prereleases on dev and stable releases on main when qualifying changes exist. Git tags define release versions; there are no package-version commits. The app header identifies the source commit.

## Operations and configuration

- **Deploy / promote early:** merge into dev for preview. Run **Weekly promotion** for lifecycle-only changes. For features, review and merge the green dev → main PR manually using a merge commit; manual dispatch does not bypass eligibility.
- **Retry / roll back:** rerun the failed workflow, or CI on the current branch if superseded. Roll back through a revert PR and manually promote it if production is affected.
- **Verify credentials:** run CI with **verify_delivery=true** for artifact, App, release-generation and preview SSH checks without publishing.
- **Review snapshots:** CI's **update_snapshots=true** produces review artifacts and deliberately fails the gate. Commit reviewed baselines, then run normal CI.
- **Add an environment:** register its target/base in build.mjs and verify-artifact.mjs; add its CI artifact, delivery/verification steps and destination-scoped credentials.

Default branch: **dev**. Dev/main require an up-to-date **CI Gate** and a PR, with no bot bypass. Secrets: **RELEASEBOT_APP_ID**, **RELEASEBOT_PRIVATE_KEY**, **DEPLOY_KEY_PREVIEW**. The App needs Contents, Pull requests and Workflows write; the built-in token reads checks/runs and records preview status. The preview SSH key writes only to the test repo.

[renovate.json](../renovate.json) groups updates and records compatibility limits: TypeScript 6.0 / Vitest 4 for Angular 22, Node 24 types, and Conventional Commits preset 9 for the release writer. Revisit these with the corresponding toolchain upgrade.
