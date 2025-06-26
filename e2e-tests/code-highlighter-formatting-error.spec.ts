import { expect } from "@playwright/test";
import { test } from "./pages/code-highlighter.page";

const invalidCode = `function (a: test) {`; // invalid JS syntax

test.describe("Code Highlighter Error Handling", () => {
  test("should display proper error message when syntactically wrong code is inserted", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();
    await page.utils.configureEditor({
      language: "JavaScript*" /* Pick a wrong language on purpose! */,
      theme: "a11y Light",
      indentMode: "Spaces",
      indentationSize: 4,
      code: invalidCode,
    });

    // Wait for async highlight
    expect(await page.utils.getHighlightedCodeText()).toContain(invalidCode);

    // Screenshot Testing
    await page.expectScreenshot("error-message-display-fullpage.png");
  });
});
