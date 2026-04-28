import {
  CodeHighlighterPage,
  CodeHighlighterUtils,
  ClipboardSnapshot,
  EditorSettings,
  EditorSettingsWithCode,
  EditorSettingsWithFile,
} from "../types/types";
import { searchLanguageByTitle } from "@utils/languages-utils";

export function createUtils(page: Omit<CodeHighlighterPage, "utils">): CodeHighlighterUtils {
  /**
   * Applies all editor settings to the UI without asserting.
   * Language is set first because it controls which other options are available.
   */
  const applySettings = async (settings: EditorSettings): Promise<void> => {
    const { enableFormatting, indentationMode, indentationSize, language, showLineNumbers, theme } = settings;

    await page.actions.setLanguage(language);
    await page.actions.setEnableFormatting(enableFormatting);
    await page.actions.setIndentationSize(indentationSize);
    await page.actions.setIndentMode(indentationMode);
    await page.actions.setShowLineNumbers(showLineNumbers);
    await page.actions.setTheme(theme);
  };

  /**
   * Asserts all editor settings against the DOM.
   * Automatically expects `enableFormatting` to be `false` when the selected
   * language has no Prettier configuration.
   */
  const assertSettings = async (settings: EditorSettings): Promise<void> => {
    const { enableFormatting, indentationMode, indentationSize, language, showLineNumbers, theme } = settings;
    const languageSupportsPrettier = Boolean(searchLanguageByTitle(language)?.prettierConfiguration);

    await page.assertions.expectLanguage(language);
    await page.assertions.expectEnableFormatting(languageSupportsPrettier ? enableFormatting : false);
    await page.assertions.expectIndentationSize(indentationSize);
    await page.assertions.expectIndentMode(indentationMode);
    await page.assertions.expectShowLineNumbers(showLineNumbers);
    await page.assertions.expectTheme(theme);
  };

  return {
    async applyEditorSettings(settings: EditorSettings) {
      await applySettings(settings);
    },

    async assertEditorSettings(settings: EditorSettings) {
      await assertSettings(settings);
    },

    async applyEditorWithCode(config: EditorSettingsWithCode) {
      await applySettings(config);
      await page.actions.inputSourceCode(config.code, config.enableFormatting);
    },

    async applyEditorWithFile(config: EditorSettingsWithFile) {
      await applySettings(config);
      await page.actions.loadSourceCodeFromFile(config.filePath, config.enableFormatting);
    },

    async getClipboardContent(): Promise<ClipboardSnapshot | null> {
      return page.evaluate(async () => {
        const item = window.__copiedClipboardItem;
        if (!item) return null;

        const [plainBlob, htmlBlob] = await Promise.all([item.getType("text/plain"), item.getType("text/html")]);

        return {
          plainText: (await plainBlob.text()).trim(),
          htmlText: (await htmlBlob.text()).trim(),
        };
      });
    },

    async getHighlightedCodeText(): Promise<string> {
      return page.locator("#highlighted-code-wrapper code").innerText();
    },
  };
}
