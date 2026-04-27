import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";
import { IndentationMode, LightTheme } from "@constants";

const LANGUAGE = "JavaScript";

const RAW_CODE = `function testFunction() { console.log("Test 123"); }`;

const FORMATTED_OUTPUT = `1. function testFunction() {
2.     console.log("Test 123");
3. }`;

const EDITOR_SETTINGS = {
  language: LANGUAGE,
  theme: LightTheme.A11yLight,
  indentationMode: IndentationMode.Spaces,
  indentationSize: 4,
  enableFormatting: true,
  showLineNumbers: true,
} as const;

test.describe("Code Highlighter – Formatting Success", () => {
  test("formats code correctly when formatting is enabled", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();

    // Arrange
    await page.utils.applyEditorWithCode({ ...EDITOR_SETTINGS, code: RAW_CODE });

    // Assert – settings
    await page.utils.assertEditorSettings(EDITOR_SETTINGS);

    // Assert – formatted output
    await expect(page.locator("#highlighted-code-wrapper code")).toContainText(FORMATTED_OUTPUT);

    await page.expectScreenshot("code-highlighter-formatting-success.png");
  });
});
