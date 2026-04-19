import { HighlightingSettings, Theme } from "@types";
import { Page } from "../fixtures";
import { IndentationMode } from "@constants";

/**
 * For clipboard mocking.
 */
declare global {
  interface Window {
    __copiedClipboardItem: ClipboardItem | null;
  }
}

export interface ConfigureEditorSettings extends HighlightingSettings {
  language: string;
  theme: Theme;
}

export interface ConfigureEditorSettingsFromCode extends ConfigureEditorSettings {
  code: string;
}

export interface ConfigureEditorSettingsFromFile extends ConfigureEditorSettings {
  filePath: string;
}

/**
 * ACTIONS
 */
export interface CodeHighlighterActions {
  clickCopyToClipboardButton(): Promise<void>;

  closeSettingsDialog(): Promise<void>;

  inputSourceCode(code: string, requiresFormatting: boolean): Promise<void>;

  loadSourceCodeFromFile(filePath: string, requiresFormatting: boolean): Promise<void>;

  setupClipboardMocking(): Promise<void>;

  openMobileSettingsPanel(): Promise<void>;

  setEnableFormatting(enableFormatting: boolean): Promise<void>;

  setIndentationSize(size: number): Promise<void>;

  setIndentMode(indentMode: IndentationMode): Promise<void>;

  setLanguage(language: string): Promise<void>;

  setShowLineNumbers(showLineNumbers: boolean): Promise<void>;

  setTheme(theme: Theme): Promise<void>;
}

/**
 * ASSERTIONS
 */
export interface CodeHighlighterAssertions {
  expectEnableFormatting(enableFormatting: boolean): Promise<void>;
  expectHasDesktopSettings(): Promise<void>;
  expectHasMobileSettings(): Promise<void>;

  expectIndentationSize(indentationSize: number): Promise<void>;

  expectIndentMode(indentMode: IndentationMode): Promise<void>;

  expectLanguage(language: string): Promise<void>;

  expectSettingsDialogContains(text: string): Promise<void>;

  expectSettingsDialogHidden(): Promise<void>;

  expectSettingsDialogVisible(): Promise<void>;

  expectShowLineNumbers(showLineNumbers: boolean): Promise<void>;

  expectTheme(theme: Theme): Promise<void>;
}

/**
 * UTILS
 */
export interface CodeHighlighterUtils {
  configureEditor(config: ConfigureEditorSettingsFromCode): Promise<void>;

  configureEditorFromFile(config: ConfigureEditorSettingsFromFile): Promise<void>;

  getClipboardContent(): Promise<{ plainText: string; htmlText: string } | null>;

  getHighlightedCodeText(): Promise<string>;
}

/**
 * Combined Page Extension
 */
export type CodeHighlighterPage = Page & {
  actions: CodeHighlighterActions;
  assertions: CodeHighlighterAssertions;
  utils: CodeHighlighterUtils;
};
