import { IndentationModeKey, ThemeKey } from "@types";
import { Page } from "../fixtures";

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
  setTheme(theme: ThemeKey): Promise<void>;
  setIndentMode(indentMode: IndentationModeKey): Promise<void>;
  setIndentationSize(size: number): Promise<void>;
  enterCode(code: string): Promise<void>;
  enterCodeFromFile(filePath: string): Promise<void>;
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
  expectTheme(theme: string): Promise<void>;
  expectIndentMode(indentMode: IndentationModeKey): Promise<void>;
  expectIndentationSize(indentationSize: number): Promise<void>;
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
  configureEditor(config: {
    language: string;
    theme: ThemeKey;
    indentMode: IndentationModeKey;
    indentationSize: number;
    code: string;
  }): Promise<void>;
  configureEditorFromFile(config: {
    language: string;
    theme: ThemeKey;
    indentMode: IndentationModeKey;
    indentationSize: number;
    filePath: string;
  }): Promise<void>;
}

/**
 * Combined Page Extension
 */
export type CodeHighlighterPage = Page & {
  actions: CodeHighlighterActions;
  assertions: CodeHighlighterAssertions;
  utils: CodeHighlighterUtils;
};
