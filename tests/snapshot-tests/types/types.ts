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

/**
 * ACTIONS
 */
export interface CodeHighlighterActions {
  setLanguage(language: string): Promise<void>;
  setTheme(theme: Theme): Promise<void>;
  setIndentMode(indentMode: IndentationMode): Promise<void>;
  setEnableFormatting(enableFormatting: boolean): Promise<void>;
  setIndentationSize(size: number): Promise<void>;
  setShowLineNumbers(showLineNumbers: boolean): Promise<void>;
  enterCode(code: string, isFormatting: boolean): Promise<void>;
  enterCodeFromFile(filePath: string, isFormatting: boolean): Promise<void>;
  clickCopyButton(): Promise<void>;
  openMobileSettings(): Promise<void>;
  closeSettingsDialog(): Promise<void>;
  mockClipboardWrite(): Promise<void>;
}

/**
 * ASSERTIONS
 */
export interface CodeHighlighterAssertions {
  expectLanguage(language: string): Promise<void>;
  expectTheme(theme: Theme): Promise<void>;
  expectIndentMode(indentMode: IndentationMode): Promise<void>;
  expectEnableFormatting(enableFormatting: boolean): Promise<void>;
  expectIndentationSize(indentationSize: number): Promise<void>;
  expectShowLineNumbers(showLineNumbers: boolean): Promise<void>;
  expectHasDesktopSettings(): Promise<void>;
  expectHasMobileSettings(): Promise<void>;
  expectSettingsDialogVisible(): Promise<void>;
  expectSettingsDialogHidden(): Promise<void>;
  expectSettingsDialogContains(text: string): Promise<void>;
}

/**
 * UTILS
 */
export interface CodeHighlighterUtils {
  getHighlightedCodeText(): Promise<string>;
  getClipboardContent(): Promise<{ plainText: string; htmlText: string } | null>;

  configureEditor(
    config: HighlightingSettings & {
      language: string;
      theme: Theme;
      code: string;
    }
  ): Promise<void>;

  configureEditorFromFile(
    config: HighlightingSettings & {
      language: string;
      theme: Theme;
      filePath: string;
    }
  ): Promise<void>;
}

/**
 * Combined Page Extension
 */
export type CodeHighlighterPage = Page & {
  actions: CodeHighlighterActions;
  assertions: CodeHighlighterAssertions;
  utils: CodeHighlighterUtils;
};
