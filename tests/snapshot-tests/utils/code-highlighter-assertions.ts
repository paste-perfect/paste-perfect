import { expect, Page } from "@playwright/test";
import { CodeHighlighterAssertions } from "../types/types";
import { IndentationMode } from "@constants";
import { getIndentationValueFromMode, getThemeValueFromTheme } from "./enum-mappers";
import { Theme } from "@types";

export function createAssertions(page: Page): CodeHighlighterAssertions {
  return {
    async expectLanguage(language: string) {
      await expect(page.locator("span#language-selector:visible")).toContainText(language);
    },
    async expectTheme(theme: Theme) {
      await expect(page.locator("span#theme-selector:visible")).toContainText(getThemeValueFromTheme(theme));
    },
    async expectIndentMode(indentMode: IndentationMode) {
      await expect(page.locator("span#indent-mode:visible")).toContainText(getIndentationValueFromMode(indentMode));
    },
    async expectIndentationSize(indentationSize: number) {
      await expect(page.locator("input#indentation-size:visible")).toHaveValue(indentationSize.toString());
    },
    async expectShowLineNumbers(showLineNumbers: boolean) {
      const formatCheckbox = page.locator("#show-line-numbers");
      const isDisabled = await formatCheckbox.isDisabled();
      if (isDisabled) {
        return;
      }

      const isChecked = (await formatCheckbox.getAttribute("aria-checked")) === "true";
      expect(isChecked).toBe(showLineNumbers);
    },
    async expectEnableFormatting(enableFormatting: boolean) {
      const formatCheckbox = page.locator("#enable-formatting");
      const isDisabled = await formatCheckbox.isDisabled();
      if (isDisabled) {
        return;
      }

      const isChecked = (await formatCheckbox.getAttribute("aria-checked")) === "true";
      expect(isChecked).toBe(enableFormatting);
    },
    async expectHasDesktopSettings() {
      await expect(page.locator("#configuration-card")).toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).not.toBeVisible();
    },
    async expectHasMobileSettings() {
      await expect(page.locator("#configuration-card")).not.toBeVisible();
      await expect(page.locator("p-button[aria-label='Open Settings'] button")).toBeVisible();
    },
    async expectSettingsDialogVisible() {
      await expect(page.locator("#highlighting-settings-dialog > div")).toBeVisible();
    },
    async expectSettingsDialogHidden() {
      await expect(page.locator("#highlighting-settings-dialog > div")).toBeHidden();
    },
    async expectSettingsDialogContains(text: string) {
      await expect(page.locator("#highlighting-settings-dialog > div")).toContainText(text);
    },
  };
}
