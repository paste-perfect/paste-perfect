import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";
import { IndentationMode, LightTheme } from "@constants";

const LANGUAGE = "JSON";

// Intentionally unsorted JSON input
const UNSORTED_JSON = `{ "zebra": 1, "apple": 2, "mango": 3 }`;

// Expected output when auto-sort is active: keys sorted alphabetically
const SORTED_OUTPUT = `{
    "apple": 2,
    "mango": 3,
    "zebra": 1
}`;

const BASE_SETTINGS = {
  language: LANGUAGE,
  theme: LightTheme.A11yLight,
  indentationMode: IndentationMode.Spaces,
  indentationSize: 4,
  showLineNumbers: false,
} as const;

test.describe("Code Highlighter – JSON Key Sorting", () => {
  test("auto-sorts JSON keys when formatting is enabled", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();

    const settings = { ...BASE_SETTINGS, enableFormatting: true };

    // Arrange
    await page.utils.applyEditorWithCode({ ...settings, code: UNSORTED_JSON });

    // Assert – settings applied correctly
    await page.utils.assertEditorSettings(settings);

    // Wait for formatting to complete — the output should change from the raw input
    const codeLocator = page.locator("#highlighted-code-wrapper code");

    await expect(async () => {
      const text = await codeLocator.textContent();
      expect(text).toContain('"apple"');
      // Verify sorted order: apple before zebra
      const appleIdx = text!.indexOf('"apple"');
      const zebraIdx = text!.indexOf('"zebra"');
      expect(appleIdx).toBeLessThan(zebraIdx);
    }).toPass({ timeout: 15000 });

    await expect(codeLocator).toContainText(SORTED_OUTPUT);
  });

  test("does not sort JSON keys when formatting is disabled", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();

    const settings = { ...BASE_SETTINGS, enableFormatting: false };

    // Arrange
    await page.utils.applyEditorWithCode({ ...settings, code: UNSORTED_JSON });

    // Assert – settings applied correctly
    await page.utils.assertEditorSettings(settings);

    // Assert – original key order is preserved verbatim
    const codeLocator = page.locator("#highlighted-code-wrapper code");
    const outputText = await codeLocator.textContent();

    const zebraIndex = outputText!.indexOf('"zebra"');
    const appleIndex = outputText!.indexOf('"apple"');

    // "zebra" was first in the input, so it must still appear before "apple"
    expect(zebraIndex).toBeGreaterThanOrEqual(0);
    expect(appleIndex).toBeGreaterThanOrEqual(0);
    expect(zebraIndex).toBeLessThan(appleIndex);
  });
});
