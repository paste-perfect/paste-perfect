# Maintenance

| Change            | Automatic result                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Dependency PR     | Framework migrations run when needed; all checks must pass before merging into `dev`.       |
| Green `dev` push  | Publish the tested preview artifact to `paste-perfect-test/gh-pages`.                       |
| Sunday, 00:00 UTC | Authorize the current `dev` commit for the `dev` → `main` sync PR; merge after checks pass. |
| Green `main` push | Publish the tested production artifact and sync main history back into dev.                 |

Sync PRs are reused while open and recreated when new changes exist. Commits added after weekly authorization wait until the next weekly run. Conflicts stop automation without discarding files. Failed, cancelled, missing or stale required checks block merging.

Releases create tags and release notes, not version commits. The header and `deployment.json` identify the exact source commit. Deployments download artifacts from the successful CI run, verify the source SHA and target, and serialize per environment. Superseded runs are ignored.

## Routine operations

- **Deploy:** merge a green PR into `dev`; preview deployment follows automatically. Production follows the weekly sync.
- **Promote early:** run **Weekly promotion** manually. The same checks still apply.
- **Retry:** rerun the failed workflow. If its commit is no longer current, rerun CI on the latest branch instead.
- **Roll back:** revert through a PR into `dev`; promote the validated revert early if production is affected.
- **Add an environment:** add its base path to `scripts/build.mjs`, build and upload it in CI, then add a destination to `release.yml`. Keep credentials limited to that destination.

## Configuration

Source default branch: `dev`. Both `dev` and `main` require **CI Gate**, an up-to-date branch, and a PR; no automation bypass. Production promotions use merge commits so semantic-release retains the original commit history.

Existing secrets: `RELEASEBOT_APP_ID`, `RELEASEBOT_PRIVATE_KEY`, and `DEPLOY_KEY_PREVIEW`. The App needs Contents, Pull requests and Workflows write; checks use the read-only built-in token. The preview key writes only to the test repository. Pages serves `gh-pages` in both repositories; the test repository's default branch is `main`.

Renovate groups the Angular/Optimus toolchain and refreshes stale branches. `config/framework-migrations.json` records applied migrations. Current compatibility limits are TypeScript 6.0 and Vitest 4 for Angular 22, and Node 24 types for Node 24. Revisit those limits when upgrading the framework; do not force incompatible peer dependencies.

The Java formatter loads two WebAssembly assets. Its Node-only imports remain external because the browser never executes those paths. SQL uses the underlying formatter directly to avoid bundling unused parser engines.
