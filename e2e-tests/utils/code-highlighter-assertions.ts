import { expect, Page } from "@playwright/test";
import { IndentationModeKey } from "@types";
import { CodeHighlighterAssertions } from "../types/types";

export function createAssertions(page: Page): CodeHighlighterAssertions {
  return {
    async expectLanguage(language: string) {
      await expect(page.locator("span#language-selector:visible")).toContainText(language);
    },
    async expectTheme(theme: string) {
      await expect(page.locator("span#theme-selector:visible")).toContainText(theme);
    },
    async expectIndentMode(indentMode: IndentationModeKey) {
      await expect(page.locator("span#indent-mode:visible")).toContainText(indentMode);
    },
    async expectIndentationSize(indentationSize: number) {
      await expect(page.locator("input#indentation-size:visible")).toHaveValue(indentationSize.toString());
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
      await expect(page.locator("p-dialog > div")).toBeVisible();
    },
    async expectSettingsDialogHidden() {
      await expect(page.locator("p-dialog > div")).toBeHidden();
    },
    async expectSettingsDialogContains(text: string) {
      await expect(page.locator("p-dialog > div")).toContainText(text);
    },
  };
}
