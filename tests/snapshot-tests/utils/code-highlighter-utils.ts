import {
  CodeHighlighterPage,
  CodeHighlighterUtils,
  ConfigureEditorSettings,
  ConfigureEditorSettingsFromCode,
  ConfigureEditorSettingsFromFile,
} from "../types/types";
import { searchLanguageByTitle } from "@constants";

export function createUtils(page: Omit<CodeHighlighterPage, "utils">): CodeHighlighterUtils {
  const configureSettings = async (config: ConfigureEditorSettings): Promise<void> => {
    const { enableFormatting, indentationMode, indentationSize, language, showLineNumbers, theme } = config;
    const isPrettierSupportedByLanguage = searchLanguageByTitle(language)?.prettierConfiguration;

    // Language must be set in the beginning
    await page.actions.setLanguage(language);
    await page.assertions.expectLanguage(language);

    // Set all configuration values
    await page.actions.setEnableFormatting(enableFormatting);
    await page.actions.setIndentationSize(indentationSize);
    await page.actions.setIndentMode(indentationMode);
    await page.actions.setShowLineNumbers(showLineNumbers);
    await page.actions.setTheme(theme);

    // Verify all configuration values
    await page.assertions.expectEnableFormatting(isPrettierSupportedByLanguage ? enableFormatting : false);
    await page.assertions.expectIndentationSize(indentationSize);
    await page.assertions.expectIndentMode(indentationMode);
    await page.assertions.expectShowLineNumbers(showLineNumbers);
    await page.assertions.expectTheme(theme);
  };

  return {
    async configureEditor(config: ConfigureEditorSettingsFromCode) {
      await configureSettings(config);
      await page.actions.inputSourceCode(config.code, config.enableFormatting);
    },

    async configureEditorFromFile(config: ConfigureEditorSettingsFromFile) {
      await configureSettings(config);
      await page.actions.loadSourceCodeFromFile(config.filePath, config.enableFormatting);
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

    async getHighlightedCodeText() {
      return page.locator("#highlighted-code-wrapper code").innerText();
    },
  };
}
