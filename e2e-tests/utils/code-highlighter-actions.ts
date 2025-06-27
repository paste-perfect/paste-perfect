import fs from "fs";
import { Page } from "../fixtures";
import { CodeHighlighterActions } from "../types/types";
import { IndentationMode } from "@constants";
import { Theme } from "@types";
import { getIndentationValueFromMode, getThemeValueFromTheme } from "./enum-mappers";

export function createActions(page: Page): CodeHighlighterActions {
  return {
    async setLanguage(language: string) {
      await page.locator("#language-selector:visible").click();
      await page.locator(`li:visible span:visible:text-is("${language}")`).click();
    },
    async setTheme(theme: Theme) {
      await page.locator("#theme-selector:visible").click();
      await page.locator(`li:visible span:visible:text-is("${getThemeValueFromTheme(theme)}")`).click();
    },
    async setIndentMode(indentMode: IndentationMode) {
      await page.locator("#indent-mode:visible").click();
      await page.locator(`li:visible span:visible:text-is("${getIndentationValueFromMode(indentMode)}")`).click();
    },
    async setEnableFormatting(enableFormatting: boolean) {
      const formatCheckbox = page.locator("#enable-formatting");
      const isDisabled = await formatCheckbox.isDisabled();
      if (isDisabled) {
        return;
      }

      const isChecked = await formatCheckbox.isChecked();

      if (isChecked !== enableFormatting) {
        // Click on the parent element (doesn't work directly on the checkbox)
        await formatCheckbox.click();
      }
    },
    async setIndentationSize(size: number) {
      await page.locator("#indentation-size:visible").fill(size.toString());
    },
    async enterCode(code: string) {
      await page.locator("#source-code").fill(code);
      await page.waitForTimeout(200);
    },
    async enterCodeFromFile(filePath: string) {
      const code = fs.readFileSync(filePath, "utf-8");
      await this.enterCode(code);
      await page.waitForTimeout(200);
    },
    async clickCopyButton() {
      await page.locator("#copy-clipboard-button").click();
    },
    async openMobileSettings() {
      await page.locator("p-button[aria-label='Open Settings'] button").click();
    },
    async closeSettingsDialog() {
      await page.locator("button.p-dialog-close-button").click();
    },
    async mockClipboardWrite() {
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
