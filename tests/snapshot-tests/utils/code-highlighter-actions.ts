import fs from "fs";
import { Page } from "../fixtures";
import { CodeHighlighterActions } from "../types/types";
import { IndentationMode } from "@constants";
import { Theme } from "@types";
import { getIndentationValueFromMode, getThemeValueFromTheme } from "./enum-mappers";

const FORMATTING_OPERATION_TIMEOUT = 500;
const STANDARD_OPERATION_TIMEOUT = 100;

export function createActions(page: Page): CodeHighlighterActions {
  /**
   * Sets a checkbox to the desired state if it's enabled
   */
  const setCheckboxState = async (checkboxSelector: string, shouldBeChecked: boolean): Promise<void> => {
    const checkbox = page.locator(checkboxSelector);
    const isDisabled = await checkbox.isDisabled();
    console.log("Disabled: ", checkbox, isDisabled);

    if (isDisabled) {
      return;
    }

    const isChecked = await checkbox.isChecked();
    if (isChecked !== shouldBeChecked) {
      await checkbox.click();
    }
  };

  const selectOptionFromDropdown = async (dropdownId: string, optionText: string): Promise<void> => {
    await page.locator(`#${dropdownId}:visible`).click();
    await page.locator(`li:visible span:visible:text-is("${optionText}")`).click();
  };

  return {
    async clickCopyToClipboardButton() {
      await page.locator("#copy-clipboard-button").click();
    },

    async closeSettingsDialog() {
      await page.locator("button.p-dialog-close-button").click();
    },

    async inputSourceCode(code: string, requiresFormatting: boolean) {
      await page.locator("#source-code").fill(code);
      const timeoutDuration = requiresFormatting ? FORMATTING_OPERATION_TIMEOUT : STANDARD_OPERATION_TIMEOUT;
      await page.waitForTimeout(timeoutDuration);
    },

    async loadSourceCodeFromFile(filePath: string, requiresFormatting: boolean) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      await this.inputSourceCode(fileContent, requiresFormatting);
    },

    async openMobileSettingsPanel() {
      await page.locator("p-button[aria-label='Open Settings'] button").click();
    },

    async setEnableFormatting(enableFormatting: boolean) {
      await setCheckboxState("#enable-formatting", enableFormatting);
    },

    async setIndentationSize(size: number) {
      await page.locator("#indentation-size:visible").fill(size.toString());
    },

    async setIndentMode(indentMode: IndentationMode) {
      await selectOptionFromDropdown("indent-mode", getIndentationValueFromMode(indentMode));
    },

    async setLanguage(language: string) {
      await selectOptionFromDropdown("language-selector", language);
    },

    async setShowLineNumbers(showLineNumbers: boolean) {
      await setCheckboxState("#show-line-numbers", showLineNumbers);
    },

    async setTheme(theme: Theme) {
      await selectOptionFromDropdown("theme-selector", getThemeValueFromTheme(theme));
    },

    async setupClipboardMocking() {
      await page.evaluate(() => {
        window.__copiedClipboardItem = null;
        navigator.clipboard.write = (items) => {
          window.__copiedClipboardItem = items[0];
          return Promise.resolve();
        };
      });
    },
  };
}
