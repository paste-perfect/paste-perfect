# Testing

Two layers of automated tests:

| Layer        | Tool                | Where it runs                                 | Speed  |
| ------------ | ------------------- | --------------------------------------------- | ------ |
| Unit         | Angular (`ng test`) | Local Browser / Headless (CI)                 | fast   |
| Snapshot/E2E | Playwright          | **Always** inside the Playwright Docker image | slower |

---

## Unit tests (Angular)

Standard Angular component and service tests.

```bash
npm run test:unit          # one-shot
npm run test:unit:watch    # watch mode while developing
npm run test:unit:coverage # with coverage report
```

CI runs `npm run test:unit:ci` (forces ChromeHeadless to prevent CI crashes). Results are uploaded as a JUnit artifact and published as a PR check.

---

## Snapshot tests (Playwright)

These compare rendered screenshots **byte-for-byte** (`maxDiffPixels: 0`). Even a 1-pixel font-rendering difference between macOS, Linux, and CI would break them, so they **always run inside the official `mcr.microsoft.com/playwright` Linux image** — locally and in CI. You only need Docker installed; no local browser/Node/Playwright setup required.

### Commands

| Command                         | When                  | Behavior                                                                        |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `npm run test:snapshots`        | Local default         | Headless run; on failure, the HTML report auto-opens at `http://localhost:9323` |
| `npm run test:snapshots:ui`     | Local interactive dev | Playwright UI (watch mode) at `http://localhost:43008`                          |
| `npm run test:snapshots:update` | After UI changes      | Regenerates baseline screenshots                                                |
| `npm run test:snapshots:ci`     | CI                    | Summary + JUnit only, no HTML auto-open                                         |
| `npm run pw:clean`              | Troubleshooting       | Tears down stuck containers and wipes cached Docker volumes                     |

### Updating snapshots

After making intentional UI changes:

```bash
npm run test:snapshots:update
git add src/tests/snapshot-tests/snapshots
```

Always update from inside the Docker image (i.e. via the npm script) — never with a host-installed Playwright, otherwise false-positive diffs will appear in CI.

### Configuration

Defaults work out of the box. Override them by placing an `.env` file next to `docker-compose-new.yml`:

| Variable                           | Default | Purpose                                                          |
| ---------------------------------- | ------- | ---------------------------------------------------------------- |
| `CI`                               | `false` | Enables stricter settings and JUnit reporters                    |
| `PLAYWRIGHT_TEST_OPTIONS`          | _empty_ | Extra CLI flags, e.g. `--grep="@smoke"`                          |
| `WEBSERVER_PORT`                   | `4200`  | Port for the Angular dev server                                  |
| `REPORT_PORT`                      | `9323`  | Port for the HTML report server                                  |
| `UI_PORT`                          | `43008` | Port for Playwright UI mode                                      |
| `USE_DOCKER_HOST_WEBSERVER`        | `false` | Set to `true` to skip launch and use host `host.docker.internal` |
| `PLAYWRIGHT_BASE_URL`              | _auto_  | Override base URL entirely                                       |
| `FILE_CHANGES_DETECTION_SUPPORTED` | `false` | Set to `true` to auto-reload tests in UI mode on file save       |

### Reports

- HTML report → `reports/playwright/html-report/`
- JUnit XML → `reports/playwright/report.xml` (CI only)

In CI both are uploaded as the `snapshot-reports-<run_id>` artifact and the JUnit file is surfaced as a PR check.
