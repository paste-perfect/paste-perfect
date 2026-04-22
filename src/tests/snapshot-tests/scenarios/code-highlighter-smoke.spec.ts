import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";

const SAMPLE_CODE = `function helloWorld() {\n  console.log("Hello, world!");\n}`;

test.describe("Code Highlighter – Smoke", () => {
  test("updates highlighted output when code is entered", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();

    // Arrange
    await page.actions.inputSourceCode(SAMPLE_CODE, false);

    // Assert
    await expect(page.locator("#highlighted-code-wrapper code")).toContainText(SAMPLE_CODE);

    await page.expectScreenshot("smoke-highlighted-output-fullpage.png");
  });
});
