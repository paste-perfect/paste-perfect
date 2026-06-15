# GitHub Repository & Branch Protection Settings

These settings make the CI/CD pipeline behave correctly. The workflow files enforce
loop-prevention and release logic, but a few behaviours can only be configured in the
GitHub UI / API (merge strategies, branch protection / rulesets, secrets, App
permissions). Apply everything below to `paste-perfect/paste-perfect`.

> **Read this first — how loop prevention actually works.**
> `release.yml` no longer relies on fragile commit-message prefixes alone. The guard
> is **branch-aware**:
>
> - **On `dev`** the guard is _actor-based_: any push by `releasebot[bot]` /
>   `semantic-release-bot` (the version-bump commit **and** the auto-merged
>   `main → dev` sync PR) is ignored. Human and Renovate merges still release.
>   The `promote` job (which runs after the `release` job via `needs:`) is also
>   automatically skipped when the release guard fires — no separate guard needed.
> - **On `main`** the guard is _message-based_: only a `chore(release):` subject (the
>   semantic-release version bump) is ignored. The `dev → main` promote merge lands
>   with a non-`chore(release):` subject, so it produces the stable release.
>
> Because of this, the **merge-commit subject for the promote PR must never start with
> `chore(release):`**. We guarantee that two ways: (1) the promote PR title is
> `chore: promote dev to main` (not `chore(release): …`), and (2) we recommend the
> repo keeps the **default** merge-commit message. See ADR notes at the bottom.

---

## Workflow inventory

| File                    | Trigger                            | Purpose                                                                                     |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `ci.yml`                | PR, push: dev, dispatch            | PR title lint, lint, lockfile, build, unit + snapshot tests, test reports                   |
| `security.yml`          | PR, schedule (Sun 04:00), dispatch | Trivy filesystem vulnerability scan (advisory)                                              |
| `release.yml`           | push: main/dev, dispatch           | semantic-release; on dev also ensures the dev→main release PR exists and labels are current |
| `scheduled-release.yml` | schedule (Sun 00:00), dispatch     | Verify lifecycle-only commits; enable auto-merge on dev→main PR                             |
| `sync-main-to-dev.yml`  | push: main, dispatch               | Backport main into dev (3-stage: staging-merge → validate → PR)                             |
| `deploy.yml`            | release: prereleased/published     | Build + deploy to GitHub Pages (preview/production)                                         |

Shared composite action: `.github/actions/release-pr/` — find/create/label the dev→main
release PR and evaluate lifecycle eligibility. Used by both `release.yml` (promote job)
and `scheduled-release.yml`.

---

## 1. Repository General Settings

`Settings → General → Pull Requests`

| Setting                            | Required value                         | Rationale                                                                                                                                                                                                                                              |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Allow merge commits                | **Enabled**                            | `dev → main` promotion merges (not squashes) so semantic-release can read every individual `feat:`/`fix:` commit and compute the correct version.                                                                                                      |
| Default commit message (merge)     | **Default message**                    | Produces `Merge pull request #N from …`. Two reasons: (a) it never starts with `chore(release):`, so `release.yml` runs on `main` after a promote; (b) conventional-changelog filters `Merge pull request …` out of release notes, keeping them clean. |
| Allow squash merging               | **Enabled**                            | `feature/* → dev` squashes to keep `dev` history linear.                                                                                                                                                                                               |
| Default commit message (squash)    | **Pull request title and description** | The squashed `dev` commit keeps a Conventional Commit subject (enforced by _PR Title Lint_ in `ci.yml`) so semantic-release on `dev` bumps the RC correctly.                                                                                           |
| Allow rebase merging               | **Disabled**                           | Rebase rewrites SHAs and breaks semantic-release tag anchoring + the sync workflow's tree-diff guard.                                                                                                                                                  |
| Automatically delete head branches | **Enabled**                            | Cleans up `feature/*`. The sync workflow keeps `automation/main-to-dev-sync` via `--delete-branch` only on successful auto-merge.                                                                                                                      |
| Allow auto-merge                   | **Enabled**                            | Required for the sync PR, the scheduled promote PR, and Renovate to auto-merge once checks pass.                                                                                                                                                       |

```bash
# CLI equivalent (requires admin):
gh api -X PATCH repos/paste-perfect/paste-perfect \
  -F allow_merge_commit=true \
  -F merge_commit_title=MERGE_MESSAGE \
  -F merge_commit_message=PR_TITLE \
  -F allow_squash_merge=true \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true \
  -F allow_auto_merge=true
```

> `merge_commit_title=MERGE_MESSAGE` + `merge_commit_message=PR_TITLE` is GitHub's
> encoding for the **"Default message"** merge option (`Merge pull request #N …`).

---

## 2. Required status check names

> **Branch protection migration note:** `Lint PR Title (Conventional Commits)` has moved
> from the standalone `pr-title-lint.yml` into `ci.yml`. In GitHub's branch-protection
> UI / REST API the full check context is `<workflow-name> / <job-name>`. Update any
> existing branch protection rules that reference the old workflow name:
>
> | Old context (remove)                                   | New context (add)                                                |
> | ------------------------------------------------------ | ---------------------------------------------------------------- |
> | `PR Title Lint / Lint PR Title (Conventional Commits)` | `CI — Test, Lint & Build / Lint PR Title (Conventional Commits)` |
>
> `Trivy — Filesystem Vulnerability Scan` stays in a dedicated `security.yml` workflow
> (renamed from `.yaml`). If you had it pinned by workflow name, update:
> `Security — Vulnerability Scan (Trivy) / Trivy — Filesystem Vulnerability Scan`
> (the workflow name and job name are unchanged; only the file extension changed).

| Check (job name)                        | Workflow       | Make required? |
| --------------------------------------- | -------------- | -------------- |
| `Lint PR Title (Conventional Commits)`  | `ci.yml`       | ✅             |
| `Lint & Format`                         | `ci.yml`       | ✅             |
| `Lockfile Integrity`                    | `ci.yml`       | ✅             |
| `Build (production)`                    | `ci.yml`       | ✅             |
| `Unit Tests`                            | `ci.yml`       | ✅             |
| `Snapshot Tests (Playwright)`           | `ci.yml`       | ✅             |
| `Trivy — Filesystem Vulnerability Scan` | `security.yml` | ❌ advisory    |

> **Why Trivy is advisory, not required:** keeping it advisory means a finding never
> blocks a merge — the team decides whether to act. It also avoids the footgun where a
> required check that can be path-skipped stays "pending" forever. The weekly cron
> uploads SARIF to the Security tab for repo-wide visibility independent of PRs.
>
> **Why all `ci.yml` jobs are required:** `ci.yml` has no `paths-ignore`, so every job
> always runs and always reports — a required check that never skips is safe to make
> required. (See ADR-006.)

---

## 3. Branch Protection — `main`

`Settings → Branches → Add rule → main`

| Setting                                    | Value                     | Rationale                                                                                                        |
| ------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Require a pull request before merging      | ✅                        | No direct pushes (except the App's version bump).                                                                |
| Required approvals                         | 1                         | Human review on everything reaching production.                                                                  |
| Dismiss stale approvals on new commits     | ✅                        | Approve-then-push protection.                                                                                    |
| Require status checks to pass              | ✅                        | The CI gate.                                                                                                     |
| Required checks                            | the ✅ rows in §2         |                                                                                                                  |
| Require branches up to date before merging | ✅                        | Prevents stale merges that confuse the sync tree-diff guard.                                                     |
| Require conversation resolution            | ✅                        | Forces threads closed before merge.                                                                              |
| Allow force pushes                         | ❌                        | Never on `main`.                                                                                                 |
| Allow deletions                            | ❌                        | `main` must never be deleted.                                                                                    |
| Do not allow bypassing the above           | ✅ (+ App on bypass list) | Admins can't skip CI; the `releasebot` App is allow-listed so the `chore(release):` bump can be pushed directly. |

```bash
gh api -X PUT repos/paste-perfect/paste-perfect/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI — Test, Lint & Build / Lint PR Title (Conventional Commits)",
      "CI — Test, Lint & Build / Lint & Format",
      "CI — Test, Lint & Build / Lockfile Integrity",
      "CI — Test, Lint & Build / Build (production)",
      "CI — Test, Lint & Build / Unit Tests",
      "CI — Test, Lint & Build / Snapshot Tests (Playwright)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "required_conversation_resolution": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

> **App bypass:** add the `releasebot` GitHub App under
> `Settings → Branches → main → Allow specified actors to bypass required pull requests`.
> semantic-release pushes the `chore(release):` bump directly to `main`; without the
> bypass that push is rejected by the "require a PR" rule.

---

## 4. Branch Protection — `dev`

`Settings → Branches → Add rule → dev`

| Setting                               | Value             | Rationale                                                                                                                                                                                                                      |
| ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Require a pull request before merging | ✅                | All work lands via PR.                                                                                                                                                                                                         |
| Required approvals                    | 1                 | (Renovate + the App bypass this on their automated PRs.)                                                                                                                                                                       |
| Require status checks to pass         | ✅                | CI gate on every PR.                                                                                                                                                                                                           |
| Required checks                       | the ✅ rows in §2 | Same set as `main`.                                                                                                                                                                                                            |
| Require branches up to date           | ❌ — see §6       | `strict` is **off**; freshness is covered by native auto-merge + the post-merge CI run on `dev` (§6). `strict: true` here makes every concurrent lifecycle PR (Renovate + the sync PR) go _out-of-date_ the moment one merges. |
| Allow auto-merge                      | ✅                | Renovate + sync PRs auto-merge once green.                                                                                                                                                                                     |
| Allow force pushes                    | ❌                |                                                                                                                                                                                                                                |

> **App / Renovate bypass for `dev`:** allow-list the `releasebot` App (pushes the RC
> `chore(release):` bump) and `renovate[bot]` (auto-merges dependency PRs) so they
> don't need a human approval.

```bash
gh api -X PUT repos/paste-perfect/paste-perfect/branches/dev/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": [
      "CI — Test, Lint & Build / Lint PR Title (Conventional Commits)",
      "CI — Test, Lint & Build / Lint & Format",
      "CI — Test, Lint & Build / Lockfile Integrity",
      "CI — Test, Lint & Build / Build (production)",
      "CI — Test, Lint & Build / Unit Tests",
      "CI — Test, Lint & Build / Snapshot Tests (Playwright)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "required_conversation_resolution": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

> **`strict: false` is intentional on `dev`.** With `strict: true`, the moment one PR
> merges, _every_ other open PR against `dev` — all concurrent Renovate lifecycle PRs
> **and** the `main → dev` sync PR — is flagged _out-of-date_ and demands a manual
> _Update branch_, which defeats unattended auto-merge. Turning it off lets GitHub's
> native auto-merge land each PR as soon as its own checks pass. The combined result is
> then validated by the **post-merge CI run on `dev`** (§6), and real file conflicts still
> force a Renovate rebase — so the only residual risk (a no-conflict semantic clash) is
> caught immediately on `dev` and fixed forward. `main` keeps `strict: true` (§3) because
> it only ever receives the single weekly promote PR, so there is no concurrency to thrash.

---

## 5. Branch Protection — `automation/*`

`Settings → Branches → Add rule → automation/*`

| Setting                     | Value | Rationale                                                                          |
| --------------------------- | ----- | ---------------------------------------------------------------------------------- |
| Allow force pushes          | ✅    | `sync-main-to-dev.yml` uses `--force-with-lease` on `automation/main-to-dev-sync`. |
| Allow deletions             | ✅    | Auto-merge with `--delete-branch` cleans up the sync branch.                       |
| Require a PR before merging | ❌    | It is itself the source branch of the sync PR.                                     |

If you have no rule matching `automation/*`, the defaults already permit force-push and
deletion — only add a rule if a broader pattern (e.g. `*`) would otherwise restrict it.

---

## 6. Post-merge validation on `dev` (no merge queue)

`dev` runs with `strict: false` (§4) and **no merge queue**. A merge queue would also fix
the out-of-date thrash, but GitHub's Rulesets merge queue proved unreliable to activate,
and `strict: true`'s per-merge rebase storm is exactly what we want to avoid. Freshness is
handled with a lighter, predictable mechanism instead:

- **Pre-merge:** each PR's required checks (§2) must pass — validates the PR in isolation.
- **Post-merge:** `ci.yml` runs the full suite on **`push: dev`**, validating the _merged_
  result. With `strict: false` a PR can land while slightly behind `dev`, so this is the
  net that catches a bad combination — within minutes, fix-forward.
- **Conflicts:** Renovate's `rebaseWhen: "conflicted"` still rebases + re-tests any PR that
  hits a real file conflict, so those never merge blind.

This is the standard "auto-merge + post-merge CI" pattern. Trade-off vs a merge queue: the
queue would catch a bad combination _before_ it lands (so `dev` never breaks), whereas the
post-merge run catches it _after_ (so `dev` can break briefly). For a dependency-bump-heavy
repo where Renovate already groups non-majors into one PR, that residual risk is small and
worth the large drop in complexity.

> If the window where "behind" matters ever feels too large, lower Renovate's
> `prConcurrentLimit` so fewer PRs are in flight against the same `dev` at once. Do **not**
> switch Renovate to `rebaseWhen: "behind-base-branch"` — that reintroduces the per-merge
> CI storm.

---

## 7. Secrets & Variables

`Settings → Secrets and variables → Actions → Repository secrets`

| Secret                   | Used by                                       | How to create                                                                                                     |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `RELEASEBOT_APP_ID`      | release, sync, scheduled-release              | `releasebot` GitHub App → App ID                                                                                  |
| `RELEASEBOT_PRIVATE_KEY` | same                                          | App → Generate private key → paste PEM                                                                            |
| `DEPLOY_KEY_PREVIEW`     | `deploy.yml` (preview → `paste-perfect-test`) | `ssh-keygen -t ed25519 -C "deploy-preview"`; private key here, public key as a deploy key on `paste-perfect-test` |

`GITHUB_TOKEN` (used for SARIF upload to the Security tab) is provided automatically.

---

## 8. `releasebot` GitHub App Permissions

| Permission    | Level | For                                                                    |
| ------------- | ----- | ---------------------------------------------------------------------- |
| Contents      | Write | Push version-bump commits, create releases, force-push the sync branch |
| Pull requests | Write | Create / update / auto-merge PRs                                       |
| Issues        | Write | Create the lifecycle labels                                            |
| Metadata      | Read  | Required for all apps                                                  |

The App must be **installed on this repository** (and on `paste-perfect-test` only if it
ever pushes there — currently the preview deploy uses `DEPLOY_KEY_PREVIEW`, not the App).

---

## 9. CODEOWNERS (recommended)

Create `.github/CODEOWNERS` (and a `@paste-perfect/maintainers` team) so DevOps-critical
files always get a review:

```
*                     @paste-perfect/maintainers
.github/workflows/**  @paste-perfect/maintainers
.github/actions/**    @paste-perfect/maintainers
renovate.json         @paste-perfect/maintainers
.releaserc.json       @paste-perfect/maintainers
```

`.github/CODEOWNERS` is in `paths-ignore` for the Trivy advisory job's source filter,
so editing it never blocks a PR on advisory checks.

---

## Decision notes (deviations from the original brief)

- **ADR-005 reversed — keep the _default_ merge-commit message, not "PR title".**
  Using the PR title as the merge subject would make the `dev → main` promote merge read
  `chore(release): …`, which `release.yml`'s own loop guard ignores on `main` — i.e. it
  would silently _suppress every stable release_. The default `Merge pull request …`
  subject is guard-safe and yields cleaner release notes. (The promote PR title is also
  `chore:`, not `chore(release):`, so the design still releases correctly even if someone
  switches this setting on.)

- **ADR-006 — `ci.yml` intentionally has no `paths-ignore`.** Its jobs are _required_
  checks; a required check skipped by a path filter stays pending and blocks the PR.
  `paths-ignore` is acceptable only on advisory (non-required) jobs. Since Trivy is
  advisory it could technically carry `paths-ignore`, but running it unconditionally (on
  all PRs, not just code PRs) is actually preferable: it costs little and catches supply-
  chain issues introduced even in doc-only PRs.

- **ADR-007 — `promote-dev-to-main.yml` folded into `release.yml` as a dependent job.**
  Running `promote` as a job that `needs: release` eliminates the benign race between two
  concurrent workflow runs on the same push. When the release guard fires (bot push),
  `release` is skipped and `promote` is automatically skipped too — no extra guard needed.
  The old separate workflow approach required duplicating the re-entrancy guard.

- **ADR-008 — PR Title Lint folded into `ci.yml`; Trivy stays in its own `security.yml`.**
  A feature PR now produces **two** workflow runs (`ci.yml` + `security.yml`) instead of
  the previous three (`ci.yml` + `pr-title-lint.yml` + `security.yaml`). Folding PR title
  lint into `ci.yml` is natural — it is a code-correctness gate that belongs alongside
  lint and tests. Keeping the Trivy scan in its own `security.yml` maintains clear
  separation of concerns: CI is about correctness, security is about vulnerability posture.
  The `pr-title` job is gated on `github.event_name == 'pull_request'`, so it doesn't run
  on the `push: dev` post-merge build — PR-title linting is only meaningful for open PRs.

- **Problem 4 — promote stays serialised via `needs:`, not `workflow_run`.**
  A `workflow_run` trigger runs from the default branch with skipped-conclusion ambiguity
  and adds real fragility. Running `promote` as a dependent job in `release.yml` is
  simpler, cleaner, and gives the correct serialisation guarantee.

- **Renovate Monday batching** is handled by `group:allNonMajor` (one combined non-major
  PR) plus `platformAutomerge`; remaining PRs auto-merge individually as their checks pass
  (no merge queue — see §6).

- **ADR-009 — `dev` uses `strict: false` + a post-merge CI run, not a merge queue.**
  `strict: true` on `dev` made every concurrent lifecycle PR (Renovate + the `main → dev`
  sync PR) go _out-of-date_ the instant one merged, forcing a manual _Update branch_ and
  stalling unattended auto-merge. A GitHub merge queue would fix that, but on Rulesets it
  was unreliable to activate, so `dev` instead runs with `strict: false` and validates the
  merged result via `ci.yml` on `push: dev` (§6). Renovate stays on
  `rebaseWhen: "conflicted"` + `platformAutomerge: true` (native auto-merge; real conflicts
  still rebase). Trade-off: `dev` can break briefly on a no-conflict semantic clash and is
  fixed forward, rather than being blocked pre-merge. `main` keeps `strict: true` (§3) — it
  only receives the single weekly promote PR, so there is no concurrency to thrash.
