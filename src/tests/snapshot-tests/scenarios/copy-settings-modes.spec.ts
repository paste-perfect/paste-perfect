import { expect } from "@playwright/test";
import { test } from "../pages/code-highlighter.page";
import { IndentationMode } from "@constants/const";
import { LightTheme } from "@constants/themes";

const LANGUAGE = "JavaScript";
const SAMPLE_CODE = `const message = "Hello, Copy Settings!";\nif (condition) {\n\treturn true;\n}`;

test.describe("Copy Settings – Modes & Customization", () => {
  test.beforeEach(async ({ page }) => {
    // Common setup for all tests
    await page.assertions.expectHasDesktopSettings();
    await page.assertions.expectCopyButtonDisabled();

    // Setup clipboard mocking
    await page.actions.setupClipboardMocking();

    // Input sample code
    await page.utils.applyEditorSettings({
      language: LANGUAGE,
      indentationSize: 2,
      indentationMode: IndentationMode.Tabs,
      theme: LightTheme.A11yLight,
      enableFormatting: true,
      showLineNumbers: false,
    });
    await page.actions.inputSourceCode(SAMPLE_CODE, false);
    await page.assertions.expectCopyButtonEnabled();
  });

  test("plain text mode copies code without HTML formatting", async ({ page }) => {
    // Arrange – open copy settings dialog
    await page.actions.openCopySettingsDialog();
    await page.assertions.expectCopySettingsDialogVisible();

    // Act – switch to plain text mode
    await page.actions.setCopyMode("PLAIN_TEXT");
    await page.expectScreenshot("copy-settings-plain-text-mode.png");

    // Act – save the settings
    await page.actions.saveCopySettings();
    await page.assertions.expectCopySettingsDialogHidden();

    // Act – copy to clipboard
    await page.actions.clickCopyToClipboardButton();

    // Assert – verify clipboard contains plain text only
    const item = await page.evaluate(() => window.__copiedClipboardItem);
    expect(item).not.toBeNull();

    const plainTextBlob = await page.evaluate(async () => {
      const clipboardItem = window.__copiedClipboardItem;
      if (!clipboardItem) return null;
      return await (await clipboardItem.getType("text/plain")).text();
    });

    expect(plainTextBlob).toBeTruthy();
    expect(plainTextBlob).toContain(SAMPLE_CODE);
    expect(plainTextBlob).not.toMatch(/<span|<div|<pre|class=/);
    expect(plainTextBlob).not.toContain("mso-");
  });

  test("office-optimized mode includes MS Office styles and adjusted indentation", async ({ page }) => {
    // Arrange – open copy settings dialog
    await page.actions.openCopySettingsDialog();
    await page.assertions.expectCopySettingsDialogVisible();

    // Act – adjust settings for Office compatibility
    await page.actions.setFontSize(18);
    await page.actions.setTabSize(2);
    await page.actions.setInlineStylesForOffice(true);
    await page.actions.setAdjustIndentationForOffice(true);

    await page.expectScreenshot("copy-settings-office-optimized-settings.png");

    // Act – save the settings
    await page.actions.saveCopySettings();
    await page.assertions.expectCopySettingsDialogHidden();

    // Act – copy to clipboard
    await page.actions.clickCopyToClipboardButton();

    // Assert – verify clipboard contains HTML with Office styles
    const item = await page.evaluate(() => window.__copiedClipboardItem);
    expect(item).not.toBeNull();

    const plainTextBlob = await page.evaluate(async () => {
      const clipboardItem = window.__copiedClipboardItem;
      if (!clipboardItem) return null;
      return await (await clipboardItem.getType("text/plain")).text();
    });

    const htmlBlob = await page.evaluate(async () => {
      const clipboardItem = window.__copiedClipboardItem;
      if (!clipboardItem) return null;
      return await (await clipboardItem.getType("text/html")).text();
    });

    expect(plainTextBlob).toContain(SAMPLE_CODE);
    expect(htmlBlob).toBeTruthy();
    expect(htmlBlob).toContain("mso-");
    expect(htmlBlob).toMatch(/font-size:\s*18px/);
  });
});
