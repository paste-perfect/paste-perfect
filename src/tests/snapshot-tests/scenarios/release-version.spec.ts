import { expect, test } from "@playwright/test";

test("shows the release tag and links to that release", async ({ page, request }, info) => {
  const artifact = info.config.metadata.productionArtifact === true;
  test.skip(!artifact && !process.env.PLAYWRIGHT_BASE_URL, "Release metadata is loaded by deployed/production builds.");
  let version: string;
  if (artifact) {
    version = "v2.10.0-rc.1";
    await page.route("**/deployment.json", (route) => route.fulfill({ json: { repository: "paste-perfect/paste-perfect", version } }));
  } else {
    const response = await request.get(new URL("deployment.json", info.project.use.baseURL).href);
    expect(response.ok()).toBe(true);
    version = (await response.json()).version;
  }
  expect(version).toMatch(/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  await page.goto(info.project.use.baseURL!);
  const link = page.locator(".github-link");
  await expect(link).toContainText(version);
  await expect(link).toHaveAttribute("href", `https://github.com/paste-perfect/paste-perfect/releases/tag/${version}`);
});
