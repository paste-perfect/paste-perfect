import { expect } from "@playwright/test";
import { test } from "./pages/code-highlighter.page";

const sampleCode = `function helloWorld() {\n  console.log("Hello, world!");\n}`;

test.describe("Code Highlighter Snapshot Smoke", () => {
  test("should update highlighted output when code is entered", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();
    await page.actions.enterCode(sampleCode, false);

    // Wait for async highlight
    expect(await page.utils.getHighlightedCodeText()).toContain(sampleCode);

    // Screenshot Testing
    await page.expectScreenshot("smoke-highlighted-output-fullpage.png");
  });
});
