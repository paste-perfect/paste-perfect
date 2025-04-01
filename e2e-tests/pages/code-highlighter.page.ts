import { Page, test as base } from "../fixtures";
import fs from "fs";

declare global {
  interface Window {
    // Add the clipboard item type for testing purposes only
    __copiedClipboardItem: ClipboardItem | null;
  }
}

export interface CodeHighlighterPage extends Page {
  setLanguage: (language: string) => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  setIndentMode: (indentMode: string) => Promise<void>;
  setIndentationSize: (size: string) => Promise<void>;
  enterCode: (code: string) => Promise<void>;
  enterCodeFromFile: (filePath: string) => Promise<void>;
  getHighlightedCodeText: () => Promise<string>;
  clickCopyButton: () => Promise<void>;
  mockClipboardWrite: () => Promise<void>;
  getClipboardContent: () => Promise<{
    plainText: string;
    htmlText: string;
  } | null>;
}

export interface CodeHighlighterFixture {
  page: CodeHighlighterPage;
}

export const test = base.extend<CodeHighlighterFixture>({
  page: async ({ page }: CodeHighlighterFixture, setup) => {
    page.setLanguage = async (language: string) => {
      await page.locator("#language-selector").click();
      await page.locator(`li span:text-is("${language}")`).click();
    };

    page.setTheme = async (theme: string) => {
      await page.locator("#theme-selector").click();
      await page.locator(`li span:text-is("${theme}")`).click();
    };

    page.setIndentMode = async (indentMode: string) => {
      await page.locator("#indent-mode").click();
      await page.locator(`li span:text-is("${indentMode}")`).click();
    };

    page.setIndentationSize = async (size: string) => {
      await page.locator("#indentation-size").fill(size);
    };

    page.enterCode = async (code: string) => {
      await page.locator("#source-code").fill(code);
    };

    page.enterCodeFromFile = async (filePath: string) => {
      const code = fs.readFileSync(filePath, "utf-8");
      await page.enterCode(code);
    };

    page.getHighlightedCodeText = async () => {
      return page.locator("#highlighted-code-wrapper code").innerText();
    };

    page.clickCopyButton = async () => {
      await page.locator("#copy-clipboard-button").click();
    };

    page.mockClipboardWrite = async () => {
      await page.evaluate(() => {
        window.__copiedClipboardItem = null;
        navigator.clipboard.write = (items) => {
          window.__copiedClipboardItem = items[0];
          return Promise.resolve();
        };
      });
    };

    page.getClipboardContent = async () => {
      return page.evaluate(async () => {
        if (!window.__copiedClipboardItem) return null;
        const item = window.__copiedClipboardItem;

        const plainBlob = await item.getType("text/plain");
        const htmlBlob = await item.getType("text/html");

        return {
          plainText: (await plainBlob.text()).trim(),
          htmlText: (await htmlBlob.text()).trim(),
        };
      });
    };

    await page.goToPath("/");
    await setup(page);
  },
});
