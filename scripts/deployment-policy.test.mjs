import { test } from "node:test";
import assert from "node:assert/strict";
import { assetUrls, validateMetadata } from "./deployment-policy.mjs";
const valid = {
  repository: "paste-perfect/paste-perfect",
  sha: "a".repeat(40),
  target: "preview",
  base: "/paste-perfect-test/",
  version: "v2.10.0-rc.1",
};
test("accepts only the expected source, commit and preview target", () => {
  assert.equal(validateMetadata(valid), valid.sha);
  assert.throws(() => validateMetadata(valid, "b".repeat(40)));
  assert.equal(validateMetadata(valid, valid.sha), valid.sha);
  for (const change of [
    { sha: "dev" },
    { repository: "fork/app" },
    { target: "production" },
    { base: "/paste-perfect/" },
    { version: "d44c424" },
    { version: undefined },
  ]) {
    assert.throws(() => validateMetadata({ ...valid, ...change }));
  }
});
test("resolves assets relative to the preview base", () => {
  assert.deepEqual(
    assetUrls('<base href="/paste-perfect-test/"><script src="main-ABC.js"></script><link href="styles-ABC.css">').map(String),
    ["https://paste-perfect.github.io/paste-perfect-test/main-ABC.js", "https://paste-perfect.github.io/paste-perfect-test/styles-ABC.css"]
  );
});
test("rejects an incorrect base, missing script or external asset", () => {
  assert.throws(() => assetUrls('<base href="/"><script src="main.js">'));
  assert.throws(() => assetUrls('<base href="/paste-perfect-test/">'));
  assert.throws(() => assetUrls('<base href="/paste-perfect-test/"><script src="https://example.com/main.js">'));
});
