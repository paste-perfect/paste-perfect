import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import syncPr from "../.github/scripts/sync-pr.cjs";

function repository(t) {
  const dir = mkdtempSync(join(tmpdir(), "paste-perfect-sync-"));
  t.after(() => {
    assert.equal(dirname(dir), tmpdir());
    rmSync(dir, { recursive: true, force: true });
  });
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commit = (message) => {
    git("add", ".");
    git("commit", "-m", message);
  };
  const dependencies = (version) => {
    const manifest = { name: "sync-fixture", private: true, dependencies: { example: `^${version}` } };
    const lock = { name: manifest.name, lockfileVersion: 3, packages: { "": manifest, "node_modules/example": { version } } };
    writeFileSync(join(dir, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
    writeFileSync(join(dir, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n");
  };
  git("init", "--initial-branch=main");
  git("config", "user.name", "Sync test");
  git("config", "user.email", "sync-test@example.invalid");
  dependencies("1.0.0");
  commit("chore: initial dependencies");
  git("checkout", "-b", "dev");
  dependencies("2.0.0");
  writeFileSync(join(dir, "migration.txt"), "Applied framework migration\n");
  commit("build(deps): update dependency with migration");
  const created = [];
  const github = {
    rest: {
      repos: {
        compareCommitsWithBasehead: async ({ basehead }) => {
          const [base, head] = basehead.split("...");
          return {
            data: {
              ahead_by: Number(git("rev-list", "--count", `${base}..${head}`)),
              files: git("diff", "--name-only", basehead)
                .split("\n")
                .filter(Boolean)
                .map((filename) => ({ filename })),
            },
          };
        },
        merge: async ({ base, head, commit_message }) => {
          git("checkout", base);
          try {
            git("merge", "--no-edit", "-m", commit_message, head);
          } catch (cause) {
            git("merge", "--abort");
            throw Object.assign(new Error("Merge conflict", { cause }), { status: 409 });
          }
        },
      },
      git: {
        getRef: async ({ ref }) => {
          try {
            return { data: { object: { sha: git("rev-parse", "--verify", `refs/${ref}`) } } };
          } catch {
            throw Object.assign(new Error("Missing branch"), { status: 404 });
          }
        },
        createRef: async ({ ref, sha }) => git("branch", ref.replace("refs/heads/", ""), sha),
      },
      pulls: {
        list: async () => ({ data: [] }),
        create: async (request) => {
          created.push(request);
          return { data: { number: created.length, html_url: "fixture" } };
        },
      },
    },
  };
  return {
    git,
    commit,
    dependencies,
    dir,
    created,
    sync: () => syncPr({ github, context: { repo: { owner: "fixture", repo: "fixture" } }, core: { info() {} } }),
  };
}

test("real Git sync preserves dependency locks, migrations and main fixes through a round trip", async (t) => {
  const { git, commit, dir, sync } = repository(t);
  const dependencyLock = git("show", "dev:package-lock.json");
  git("checkout", "main");
  writeFileSync(join(dir, "hotfix.txt"), "Production fix\n");
  commit("fix: production hotfix");
  await sync();
  git("checkout", "dev");
  git("merge", "--no-ff", "--no-edit", "automation/main-to-dev-sync");
  git("checkout", "main");
  git("merge", "--no-ff", "--no-edit", "dev");
  await sync();
  git("checkout", "dev");
  git("merge", "--no-ff", "--no-edit", "automation/main-to-dev-sync");
  for (const branch of ["main", "dev"]) {
    assert.equal(git("show", `${branch}:package-lock.json`), dependencyLock);
    assert.equal(JSON.parse(git("show", `${branch}:package.json`)).dependencies.example, "^2.0.0");
    assert.equal(git("show", `${branch}:migration.txt`), "Applied framework migration");
    assert.equal(git("show", `${branch}:hotfix.txt`), "Production fix");
  }
  assert.equal(git("rev-list", "--count", "dev..main"), "0");
});

test("competing dependency versions stop sync without overwriting either branch", async (t) => {
  const { git, dependencies, commit, created, sync } = repository(t);
  git("checkout", "main");
  dependencies("1.1.0");
  commit("build(deps): production dependency fix");
  const before = [git("rev-parse", "dev"), git("rev-parse", "main")];
  await assert.rejects(sync(), { status: 409 });
  assert.deepEqual([git("rev-parse", "dev"), git("rev-parse", "main")], before);
  assert.deepEqual(created, []);
});
