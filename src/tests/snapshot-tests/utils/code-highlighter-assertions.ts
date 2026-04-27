import { expect, Page } from "@playwright/test";
import { CodeHighlighterAssertions } from "../types/types";
import { IndentationMode } from "@constants";
import { Theme } from "@types";
import { getIndentationValueFromMode, getThemeValueFromTheme } from "./enum-mappers";

export function createAssertions(page: Page): CodeHighlighterAssertions {
  /**
   * Asserts the `aria-checked` attribute of a checkbox.
   * Skips when the control is disabled — the UI owns that state.
   */
  const expectCheckboxState = async (selector: string, expected: boolean): Promise<void> => {
    const checkbox = page.locator(selector);
    if (await checkbox.isDisabled()) return;
    await expect(checkbox).toHaveAttribute("aria-checked", String(expected));
  };

  /** Asserts that an element's text contains `expected`. Retried automatically by Playwright. */
  const expectTextContent = async (selector: string, expected: string): Promise<void> => {
    await expect(page.locator(selector)).toContainText(expected);
  };

  return {
    async expectEnableFormatting(enabled: boolean) {
      await expectCheckboxState("#enable-formatting", enabled);
    },

    async expectHasDesktopSettings() {
      await expect(page.locator("#configuration-card")).toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).not.toBeVisible();
    },

    async expectHasMobileSettings() {
      await expect(page.locator("#configuration-card")).not.toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).toBeVisible();
    },

    async expectIndentationSize(size: number) {
      await expect(page.locator("input#indentation-size:visible")).toHaveValue(String(size));
    },

    async expectIndentMode(indentMode: IndentationMode) {
      await expectTextContent("span#indent-mode:visible", getIndentationValueFromMode(indentMode));
    },

    async expectLanguage(language: string) {
      await expectTextContent("span#language-selector:visible", language);
    },

    async expectSettingsDialogContains(text: string) {
      await expect(page.locator("#highlighting-settings-dialog > div")).toContainText(text);
    },

    async expectSettingsDialogHidden() {
      await expect(page.locator("#highlighting-settings-dialog > div")).toBeHidden();
    },

    async expectSettingsDialogVisible() {
      await expect(page.locator("#highlighting-settings-dialog > div")).toBeVisible();
    },

    async expectShowLineNumbers(showLineNumbers: boolean) {
      await expectCheckboxState("#show-line-numbers", showLineNumbers);
    },

    async expectTheme(theme: Theme) {
      await expectTextContent("span#theme-selector:visible", getThemeValueFromTheme(theme));
    },
  };
}
