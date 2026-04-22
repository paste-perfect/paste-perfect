import fs from "fs";
import { Page } from "@playwright/test";
import { CodeHighlighterActions } from "../types/types";
import { IndentationMode } from "@constants";
import { Theme } from "@types";
import { getThemeValueFromTheme, getIndentationValueFromMode } from "./enum-mappers";

const SELECTORS = {
  copyButton: "#copy-to-clipboard-button",
  closeSettingsButton: "#highlighting-settings-dialog button[aria-label='Close Settings Dialog']",
  sourceCodeEditor: "textarea#source-code",
  openMobileSettingsButton: "#open-settings",
  enableFormattingCheckbox: "#enable-formatting",
  indentationSizeInput: "input#indentation-size:visible",
  indentModeSelector: "#indent-mode:visible",
  languageSelector: "#language-selector:visible",
  showLineNumbersCheckbox: "#show-line-numbers:visible",
  themeSelector: "#theme-selector:visible",
  highlightedCodeWrapper: "#highlighted-code-wrapper code",
} as const;

export function createActions(page: Page): CodeHighlighterActions {
  /**
   * Sets a checkbox to `targetState`. Skips the click if the checkbox is
   * disabled or already in the desired state.
   */
  const setCheckboxState = async (selector: string, targetState: boolean): Promise<void> => {
    const checkbox = page.locator(selector);
    if (await checkbox.isDisabled()) return;

    const isCurrentlyChecked = (await checkbox.getAttribute("aria-checked")) === "true";
    if (isCurrentlyChecked !== targetState) {
      await checkbox.click();
    }
  };

  /**
   * Clicks a dropdown trigger and selects the option matching `optionText`.
   */
  const selectDropdownOption = async (triggerSelector: string, optionText: string): Promise<void> => {
    await page.locator(triggerSelector).click();
    await page.getByRole("option", { name: optionText, exact: true }).click();
  };

  return {
    async clickCopyToClipboardButton() {
      await page.locator(SELECTORS.copyButton).click();
    },

    async closeSettingsDialog() {
      await page.locator(SELECTORS.closeSettingsButton).click();
    },

    async inputSourceCode(code: string, requiresFormatting: boolean) {
      const editor = page.locator(SELECTORS.sourceCodeEditor);
      await editor.click();
      await editor.fill(code);

      if (requiresFormatting) {
        await page.locator(SELECTORS.highlightedCodeWrapper).waitFor({ state: "visible" });
      }
    },

    async loadSourceCodeFromFile(filePath: string, requiresFormatting: boolean) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      await this.inputSourceCode(fileContent, requiresFormatting);
    },

    async setupClipboardMocking() {
      await page.evaluate(() => {
        window.__copiedClipboardItem = null;

        const original = navigator.clipboard.write.bind(navigator.clipboard);
        navigator.clipboard.write = async (items: ClipboardItem[]) => {
          window.__copiedClipboardItem = items[0] ?? null;
          return original(items);
        };
      });
    },

    async openMobileSettingsPanel() {
      await page.locator(SELECTORS.openMobileSettingsButton).click();
    },

    async setEnableFormatting(enabled: boolean) {
      await setCheckboxState(SELECTORS.enableFormattingCheckbox, enabled);
    },

    async setIndentationSize(size: number) {
      const input = page.locator(SELECTORS.indentationSizeInput);
      await input.fill(String(size));
      await input.press("Tab");
    },

    async setIndentMode(indentMode: IndentationMode) {
      await selectDropdownOption(SELECTORS.indentModeSelector, getIndentationValueFromMode(indentMode));
    },

    async setLanguage(language: string) {
      await selectDropdownOption(SELECTORS.languageSelector, language);
    },

    async setShowLineNumbers(showLineNumbers: boolean) {
      await setCheckboxState(SELECTORS.showLineNumbersCheckbox, showLineNumbers);
    },

    async setTheme(theme: Theme) {
      await selectDropdownOption(SELECTORS.themeSelector, getThemeValueFromTheme(theme));
    },
  };
}
