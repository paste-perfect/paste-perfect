import { IndentationModeKey, ThemeKey } from "@types";
import fs from "fs";
import { Page } from "../fixtures";
import { CodeHighlighterActions } from "../types/types";

export function createActions(page: Page): CodeHighlighterActions {
  return {
    async setLanguage(language: string) {
      await page.locator("#language-selector:visible").click();
      await page.locator(`li:visible span:visible:text-is("${language}")`).click();
    },
    async setTheme(theme: ThemeKey) {
      await page.locator("#theme-selector:visible").click();
      await page.locator(`li:visible span:visible:text-is("${theme}")`).click();
    },
    async setIndentMode(indentMode: IndentationModeKey) {
      await page.locator("#indent-mode:visible").click();
      await page.locator(`li:visible span:visible:text-is("${indentMode}")`).click();
    },
    async setIndentationSize(size: number) {
      await page.locator("#indentation-size:visible").fill(size.toString());
    },
    async enterCode(code: string) {
      await page.locator("#source-code").fill(code);
      await page.waitForTimeout(50);
    },
    async enterCodeFromFile(filePath: string) {
      const code = fs.readFileSync(filePath, "utf-8");
      await this.enterCode(code);
      await page.waitForTimeout(50);
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
