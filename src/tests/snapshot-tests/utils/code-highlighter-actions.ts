import fs from "fs";
import { Page } from "@playwright/test";
import { CodeHighlighterActions } from "../types/types";
import { Theme } from "@types";
import { getThemeValueFromTheme, getIndentationValueFromMode } from "./enum-mappers";
import { IndentationMode } from "@constants/const";

export const SELECTORS = {
  copyButton: "#copy-to-clipboard-button button",
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
  openCopySettingsButton: "#copy-settings-button",
  copySettingsDialog: "#copy-settings-dialog > div",
  copyModeSelect: "#copy-mode-select",
  fontSizeSelect: "#font-size-select",
  tabSizeSelect: "#office-tab-size-select",
  inlineStylesCheckbox: "#inline-styles-checkbox",
  adjustIndentationCheckbox: "#adjust-indentation-checkbox",
} as const;

export function createActions(page: Page): CodeHighlighterActions {
  /**
   * Sets a checkbox to `targetState`. Skips the click if the checkbox is
   * disabled or already in the desired state.
   */
  const setCheckboxState = async (selector: string, targetState: boolean): Promise<void> => {
    const locator = page.locator(selector);
    if (await locator.isDisabled()) return;

    // Get the input element: if the locator points to an input, use it directly;
    // otherwise, try to find an input inside the locator
    const inputElement = (await locator.evaluate((el) => el.tagName === "INPUT")) ? locator : locator.locator("input");

    const isCurrentlyChecked = await inputElement.isChecked();
    if (isCurrentlyChecked !== targetState) {
      await locator.click();
      // Wait for the state to settle after click
      await page.waitForTimeout(100);
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

    async openCopySettingsDialog() {
      await page.locator(SELECTORS.openCopySettingsButton).click();
      await page.locator(SELECTORS.copySettingsDialog).waitFor({ state: "visible" });
    },

    async setCopyMode(mode: "HTML" | "PLAIN_TEXT") {
      const modeLabel = mode === "HTML" ? "HTML (Formatted)" : "Native Text (Plain)";
      await page.getByRole("button", { name: modeLabel }).click();
    },

    async setFontSize(size: number) {
      await selectDropdownOption(SELECTORS.fontSizeSelect, `${size}px`);
    },

    async setTabSize(size: number) {
      await selectDropdownOption(SELECTORS.tabSizeSelect, `${size}cm`);
    },

    async setInlineStylesForOffice(enabled: boolean) {
      await setCheckboxState(SELECTORS.inlineStylesCheckbox, enabled);
    },

    async setAdjustIndentationForOffice(enabled: boolean) {
      await setCheckboxState(SELECTORS.adjustIndentationCheckbox, enabled);
    },

    async saveCopySettings() {
      await page.locator(SELECTORS.copySettingsDialog).getByRole("button", { name: "Save" }).click();
      await page.locator(SELECTORS.copySettingsDialog).waitFor({ state: "hidden" });
    },

    async cancelCopySettings() {
      await page.locator(SELECTORS.copySettingsDialog).getByRole("button", { name: "Cancel" }).click();
      await page.locator(SELECTORS.copySettingsDialog).waitFor({ state: "hidden" });
    },
  };
}
