import { expect, Page } from "@playwright/test";
import { CodeHighlighterAssertions } from "../types/types";
import { IndentationMode } from "@constants";
import { getIndentationValueFromMode, getThemeValueFromTheme } from "./enum-mappers";
import { Theme } from "@types";

export function createAssertions(page: Page): CodeHighlighterAssertions {
  const expectCheckboxState = async (selector: string, expectedState: boolean): Promise<void> => {
    const checkbox = page.locator(selector);
    const isDisabled = await checkbox.isDisabled();

    if (isDisabled) return;

    const isChecked = (await checkbox.getAttribute("aria-checked")) === "true";
    expect(isChecked).toBe(expectedState);
  };

  const expectSelectorText = async (selector: string, expectedText: string): Promise<void> => {
    await expect(page.locator(selector)).toContainText(expectedText);
  };

  return {
    async expectEnableFormatting(enableFormatting: boolean) {
      await expectCheckboxState("#enable-formatting", enableFormatting);
    },

    async expectHasDesktopSettings() {
      await expect(page.locator("#configuration-card")).toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).not.toBeVisible();
    },

    async expectHasMobileSettings() {
      await expect(page.locator("#configuration-card")).not.toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).toBeVisible();
    },

    async expectIndentationSize(indentationSize: number) {
      await expect(page.locator("input#indentation-size:visible")).toHaveValue(indentationSize.toString());
    },

    async expectIndentMode(indentMode: IndentationMode) {
      await expectSelectorText("span#indent-mode:visible", getIndentationValueFromMode(indentMode));
    },

    async expectLanguage(language: string) {
      await expectSelectorText("span#language-selector:visible", language);
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
      await expectSelectorText("span#theme-selector:visible", getThemeValueFromTheme(theme));
    },
  };
}
