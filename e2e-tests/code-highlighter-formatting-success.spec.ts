import { expect } from "@playwright/test";
import { test } from "./pages/code-highlighter.page";
import { IndentationMode, LightTheme } from "@constants";

const input = `function testFunction() { console.log("Test 123"); }`; // valid JS syntax
const expectedOutput = `function testFunction() {
    console.log("Test 123");
}`;

test.describe("Code Highlighter Formatting Success", () => {
  test("should properly format code when formatting is enabled", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();
    await page.utils.configureEditor({
      language: "JavaScript*",
      theme: LightTheme.A11yLight,
      indentationMode: IndentationMode.Spaces,
      indentationSize: 4,
      enableFormatting: true,
      code: input,
    });

    // Wait for async highlight
    expect(await page.utils.getHighlightedCodeText()).toContain(expectedOutput);

    // Screenshot Testing
    await page.expectScreenshot("code-highlighter-formatting-success.png");
  });
});
