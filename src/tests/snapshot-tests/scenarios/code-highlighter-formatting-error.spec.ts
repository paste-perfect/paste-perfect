import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";
import { IndentationMode, LightTheme } from "@constants";

const LANGUAGE = "JavaScript";
const INVALID_JS_CODE = `function (a: test) {`;

const EDITOR_SETTINGS = {
  language: LANGUAGE,
  theme: LightTheme.A11yLight,
  indentationMode: IndentationMode.Spaces,
  indentationSize: 4,
  enableFormatting: true,
  showLineNumbers: false,
} as const;

test.describe("Code Highlighter – Formatting Error", () => {
  test("displays an error when code with invalid syntax is submitted", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();

    // Arrange
    await page.utils.applyEditorWithCode({ ...EDITOR_SETTINGS, code: INVALID_JS_CODE });

    // Assert – settings
    await page.utils.assertEditorSettings(EDITOR_SETTINGS);

    // Assert – output contains the raw invalid input
    await expect(page.locator("#highlighted-code-wrapper code")).toContainText(INVALID_JS_CODE);

    await page.expectScreenshot("error-message-display-fullpage.png");
  });
});
