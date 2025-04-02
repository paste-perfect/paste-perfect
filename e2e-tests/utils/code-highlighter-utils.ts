import { CodeHighlighterPage, CodeHighlighterUtils } from "../types/types";

export function createUtils(page: Omit<CodeHighlighterPage, "utils">): CodeHighlighterUtils {
  return {
    async getHighlightedCodeText() {
      return page.locator("#highlighted-code-wrapper code").innerText();
    },
    async getClipboardContent() {
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
    },
    async configureEditor({ language, theme, indentMode, indentationSize, code }) {
      await page.actions.setLanguage(language);
      await page.actions.setTheme(theme);
      await page.actions.setIndentMode(indentMode);
      await page.actions.setIndentationSize(indentationSize);

      await page.assertions.expectLanguage(language);
      await page.assertions.expectTheme(theme);
      await page.assertions.expectIndentMode(indentMode);
      await page.assertions.expectIndentationSize(indentationSize);

      await page.actions.enterCode(code);
    },
    async configureEditorFromFile({ language, theme, indentMode, indentationSize, filePath }) {
      await page.actions.setLanguage(language);
      await page.actions.setTheme(theme);
      await page.actions.setIndentMode(indentMode);
      await page.actions.setIndentationSize(indentationSize);

      await page.assertions.expectLanguage(language);
      await page.assertions.expectTheme(theme);
      await page.assertions.expectIndentMode(indentMode);
      await page.assertions.expectIndentationSize(indentationSize);

      await page.actions.enterCodeFromFile(filePath);
    },
  };
}
