import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const dir = process.argv[2];
const metadata = JSON.parse(readFileSync(join(dir, "deployment.json"), "utf8"));
if (!process.env.TESTED_SHA || metadata.sha !== process.env.TESTED_SHA || metadata.repository !== "paste-perfect/paste-perfect") {
  throw new Error("Artifact does not match the successfully tested source commit.");
}
if (!existsSync(join(dir, "index.html"))) throw new Error("Artifact is missing index.html.");
if (metadata.target !== process.env.EXPECTED_TARGET) throw new Error("Artifact belongs to the wrong environment.");
const bases = { production: "/paste-perfect/", preview: "/paste-perfect-test/" };
if (!bases[metadata.target] || metadata.base !== bases[metadata.target]) throw new Error("Artifact has an incorrect base path.");
console.log(`Verified ${metadata.target} artifact from ${metadata.sha}`);
