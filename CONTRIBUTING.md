# Contributing

Use Node from `.node-version` and the npm version in `package.json`'s `packageManager`. Run `npm ci`, then `npm start`. After changing dependencies, run `npm install` with that npm version and commit `package-lock.json`; CI rejects a lockfile npm would rewrite.

Open PRs against `dev` with a Conventional Commit title, for example `fix: preserve clipboard indentation`. CI checks the merged result before automation can merge it.

```sh
npm run lint:check
npm run format:check
npm run test:unit
npm run test:automation
npm run test:snapshots
npm run build-prod
```

`test:snapshots` uses Docker and derives the browser image version from the installed Playwright package. For native browser testing, run `npx playwright install chromium` and `npm run test:snapshots:local`. Visual and clipboard HTML baselines are reviewed on Linux; font metrics differ on Windows and macOS.

To update visual and clipboard baselines, run CI manually with `update_snapshots` enabled. Download `visual-baselines` into `src/tests/snapshot-tests`, review the changes and commit them. Generation intentionally fails CI Gate; a normal run must pass before merging.

The app uses Angular's zoneless change detection and default OnPush strategy. State changed asynchronously or through another component must notify Angular, usually through a signal. Formatters and syntax grammars load on demand. Inputs from `LARGE_INPUT_LENGTH` characters are reprocessed only after a short typing pause. The highlighted output is bound as trusted HTML because Prism escapes all code text; anything added to that output must stay escaped.

See [maintenance](docs/maintenance.md) for deployment and dependency automation.
