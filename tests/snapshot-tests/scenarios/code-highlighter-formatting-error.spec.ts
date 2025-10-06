import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";
import { IndentationMode, LightTheme } from "@constants";

const invalidCode = `function (a: test) {`; // invalid JS syntax

test.describe("Code Highlighter Error Handling", () => {
  test("should display proper error message when syntactically wrong code is inserted", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();
    await page.utils.configureEditor({
      language: "JavaScript*" /* Pick a wrong language on purpose! */,
      theme: LightTheme.A11yLight,
      indentationMode: IndentationMode.Spaces,
      indentationSize: 4,
      enableFormatting: true,
      showLineNumbers: false, // TODO: Replace me
      code: invalidCode,
    });

    await page.waitForTimeout(500); // Otherwise this test sometimes ran into timeout issues

    // Wait for async highlight
    expect(await page.utils.getHighlightedCodeText()).toContain(invalidCode);

    // Screenshot Testing
    await page.expectScreenshot("error-message-display-fullpage.png");
  });
});
