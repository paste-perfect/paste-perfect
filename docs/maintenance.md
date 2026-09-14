# Release and deployment guide

The source repository owns dependencies and automation. The test repository contains documentation on **main** and built preview files on **gh-pages**, with no dependencies or tooling. Both Pages sites serve **gh-pages** from its root.

## Normal lifecycle

1. **PR:** validate its merge result and Conventional Commit title. Green Renovate PRs merge into **dev** automatically; failed, pending, missing or stale checks block merging.
2. **Dev push:** validate the new commit once and build production/preview artifacts. Delivery publishes an **rc** release when needed, deploys the preview artifact to the test repository and verifies the live site.
3. **Weekly promotion:** Sunday at **00:00 UTC**, authorize the current dev commit for automatic promotion only if its unreleased history consists of Renovate PRs or maintenance PRs explicitly labeled **lifecycle**. Feature (**feat:**) PRs remain manual even when labeled. Any feature or unclassified change keeps the whole sync PR open.
4. **Main push:** validate, publish a stable release when needed and deploy the production artifact. A checked reverse-sync PR brings main history back into dev.

Sync PRs are reused while open and recreated for later changes. Production requires green PR checks and **Preview verified** for the authorized commit. Later commits wait for the next weekly authorization; labels and eligibility are rechecked before merging. Dependency ranges, lockfiles and migrations merge together. Conflicts require resolution; automation never chooses one side's files wholesale.

## Workflows

| Workflow                                                              | Responsibility                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pull-request.yml](../.github/workflows/pull-request.yml)             | PRs and merge groups. Publishes the fixed required checks **CI Gate** and **Lint PR Title (Conventional Commits)**. Regular code changes use the full shared suite.                                              |
| [ci.yml](../.github/workflows/ci.yml)                                 | Dev/main pushes and manual runs. Validates the branch commit and produces both deployment artifacts; reports **Branch validation**.                                                                              |
| [validation.yml](../.github/workflows/validation.yml)                 | Shared lint, formatting, migrations, lockfile, unit/browser and vulnerability checks, plus builds. All checks must pass.                                                                                         |
| [migrations.yml](../.github/workflows/migrations.yml)                 | Applies framework migrations to Renovate PRs and commits through the release App, triggering fresh validation.                                                                                                   |
| [auto-merge.yml](../.github/workflows/auto-merge.yml)                 | After PR validation or delivery, plus **06:15 and 18:15 UTC** retries. Refreshes outdated Renovate branches, maintains sync PRs and merges eligible, current, green PRs.                                         |
| [scheduled-release.yml](../.github/workflows/scheduled-release.yml)   | Weekly promotion authorization, or manual dispatch for an earlier lifecycle-only promotion.                                                                                                                      |
| [release.yml](../.github/workflows/release.yml)                       | Successful dev/main push CI only. Ignores superseded commits, verifies that run's artifact, publishes release notes/tags, stamps its version and deploys. Delivery is serialized per environment.                |
| [verify-preview.yml](../.github/workflows/verify-preview.yml)         | After deployment, at **06:15 and 18:15 UTC**, or manually. Checks live metadata/assets and runs browser checks using the deployed revision's dependencies. Delivery records **Preview verified** on that commit. |
| [delivery-preflight.yml](../.github/workflows/delivery-preflight.yml) | Manual artifact and credential dry run, using an existing successful push CI run. No rebuild or publishing.                                                                                                      |
| [security.yml](../.github/workflows/security.yml)                     | Sunday **04:00 UTC**, or manually, publishes the GitHub Security report. CI also has a required vulnerability scan.                                                                                              |

**Avoiding duplicate validation:** dev → main reuses successful dev push CI for the exact head, provided main is already included in dev. Same-repository title/body edits reuse code validation identified by the immutable PR number, head and base in its run name. They keep a real **CI Gate** and never cancel code validation. Retargeting the base runs validation again. Fork PRs always run the full suite. A push after merging validates the new branch commit and produces its delivery artifacts.

## Scripts and versions

- [reuse-validation.cjs](../.github/scripts/reuse-validation.cjs) checks current PR ancestry and waits for the latest matching code run; failed, cancelled or missing validation cannot be reused.
- [sync-pr.cjs](../.github/scripts/sync-pr.cjs), [promotion-policy.cjs](../.github/scripts/promotion-policy.cjs) and [merge-green.cjs](../.github/scripts/merge-green.cjs) manage sync history, lifecycle eligibility and the final merge checks.
- [framework-migrations.mjs](../scripts/framework-migrations.mjs) applies the framework-provided migrations recorded in [the ledger](../config/framework-migrations.json).
- [build.mjs](../scripts/build.mjs), [verify-artifact.mjs](../scripts/verify-artifact.mjs) and [stamp-release.mjs](../scripts/stamp-release.mjs) build, validate provenance and add the release tag without changing the tested bundles.
- [verify-deployment.mjs](../scripts/verify-deployment.mjs) verifies live source metadata and assets, with retries while Pages propagates.

[Semantic-release](../.releaserc.json) uses Git tags as the release-version authority; there are no package-version commits to reconcile. Dependency updates create patch releases; explicit breaking changes remain major releases. The header displays and links to the tag from **deployment.json**, which retains the source SHA for verification. History-only deployments retain the reachable release version; production excludes prereleases.

Shared setup uses **.node-version**, the exact npm **packageManager** version and **npm ci** in CI, delivery and live-preview testing. Renovate maintains the package-manager pin alongside dependencies. Correcting a PR title reuses passing code checks; the corrected title is still required to pass separately.

## Operations

- **Retry:** rerun the failed push CI or delivery run for the current dev/main commit. If superseded, use the run for the newer commit.
- **Promote features:** manually merge the green dev → main PR using a merge commit. Weekly/manual promotion dispatch does not bypass lifecycle eligibility.
- **Roll back:** merge a revert PR; manually promote it if production is affected.
- **Verify credentials:** run **Deployment preflight**, supplying a successful dev/main push CI **run_id** with both artifacts.
- **Review snapshots:** manual CI with **update_snapshots=true** produces review artifacts and deliberately fails validation. Commit reviewed baselines and run normal CI.
- **Add an environment:** register its target/base in the build/provenance scripts, then add its artifact, delivery/verification steps and destination-scoped credentials.

Default branch: **dev**. Dev/main require an up-to-date **CI Gate**, the title check and a PR, with no bot bypass. Secrets: **RELEASEBOT_APP_ID**, **RELEASEBOT_PRIVATE_KEY**, **DEPLOY_KEY_PREVIEW**. The App needs Contents, Pull requests and Workflows write; the built-in token reads checks and records preview status. The SSH key writes only to the test repository.

[Renovate](../renovate.json) records compatibility limits for Angular's TypeScript/Vitest versions, Node types and the release writer's Conventional Commits preset. Review those limits with their corresponding toolchain upgrade.
