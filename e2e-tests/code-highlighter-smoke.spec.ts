import { expect } from "@playwright/test";
import { test } from "./pages/code-highlighter.page";

const sampleCode = `function helloWorld() {\n  console.log("Hello, world!");\n}`;

test.describe("Code Highlighter E2E Smoke", () => {
  test("should update highlighted output when code is entered", async ({ page }) => {
    await page.enterCode(sampleCode);

    // Wait for async highlight
    expect(await page.getHighlightedCodeText()).toContain(sampleCode);

    // Screenshot Testing
    await page.expectScreenshot("smoke-highlighted-output-fullpage.png");
  });
});
