import { HighlightingSettings, Theme } from "@types";
import { Page } from "../fixtures";
import { IndentationMode } from "@constants";

// ---------------------------------------------------------------------------
// Global augmentations
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    /** Populated by `setupClipboardMocking()` after the first copy action. */
    __copiedClipboardItem: ClipboardItem | null;
  }
}

// ---------------------------------------------------------------------------
// Configuration shapes
// ---------------------------------------------------------------------------

/** All settings that can be applied to the editor (without code/file source). */
export interface EditorSettings extends HighlightingSettings {
  language: string;
  theme: Theme;
}

/** Settings + inline code source. */
export interface EditorSettingsWithCode extends EditorSettings {
  code: string;
}

/** Settings + file path source. */
export interface EditorSettingsWithFile extends EditorSettings {
  filePath: string;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface CodeHighlighterActions {
  /** Clicks the "Copy to clipboard" button. Requires `setupClipboardMocking()` first. */
  clickCopyToClipboardButton(): Promise<void>;

  /** Closes the mobile/dialog settings panel. */
  closeSettingsDialog(): Promise<void>;

  /** Types `code` into the source editor. Waits for highlighted output to appear. */
  inputSourceCode(code: string, requiresFormatting: boolean): Promise<void>;

  /** Uploads a file into the source editor. Waits for highlighted output to appear. */
  loadSourceCodeFromFile(filePath: string, requiresFormatting: boolean): Promise<void>;

  /** Intercepts `navigator.clipboard.write` so copied data can be inspected. */
  setupClipboardMocking(): Promise<void>;

  /** Opens the settings panel on mobile (floating button). */
  openMobileSettingsPanel(): Promise<void>;

  /** Toggles the "Enable formatting" checkbox to the desired state. */
  setEnableFormatting(enabled: boolean): Promise<void>;

  /** Sets the indentation size input field. */
  setIndentationSize(size: number): Promise<void>;

  /** Selects the indentation mode (spaces / tabs). */
  setIndentMode(indentMode: IndentationMode): Promise<void>;

  /** Selects a language from the language dropdown. */
  setLanguage(language: string): Promise<void>;

  /** Toggles the "Show line numbers" checkbox to the desired state. */
  setShowLineNumbers(showLineNumbers: boolean): Promise<void>;

  /** Selects a theme from the theme dropdown. */
  setTheme(theme: Theme): Promise<void>;
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export interface CodeHighlighterAssertions {
  expectEnableFormatting(enabled: boolean): Promise<void>;
  expectHasDesktopSettings(): Promise<void>;
  expectHasMobileSettings(): Promise<void>;
  expectIndentationSize(size: number): Promise<void>;
  expectIndentMode(indentMode: IndentationMode): Promise<void>;
  expectLanguage(language: string): Promise<void>;
  expectSettingsDialogContains(text: string): Promise<void>;
  expectSettingsDialogHidden(): Promise<void>;
  expectSettingsDialogVisible(): Promise<void>;
  expectShowLineNumbers(showLineNumbers: boolean): Promise<void>;
  expectTheme(theme: Theme): Promise<void>;
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

export interface ClipboardSnapshot {
  plainText: string;
  htmlText: string;
}

export interface CodeHighlighterUtils {
  /**
   * Applies all editor settings (arrange phase only).
   * Call `assertEditorSettings` afterwards to verify them.
   */
  applyEditorSettings(settings: EditorSettings): Promise<void>;

  /**
   * Asserts that all editor settings match the given config (assert phase only).
   * Language-gated options (e.g. formatting) are handled automatically.
   */
  assertEditorSettings(settings: EditorSettings): Promise<void>;

  /**
   * Full arrange-only setup: applies settings and types code into the editor.
   * Does NOT assert — call `assertEditorSettings` separately.
   */
  applyEditorWithCode(config: EditorSettingsWithCode): Promise<void>;

  /**
   * Full arrange-only setup: applies settings and loads code from a file.
   * Does NOT assert — call `assertEditorSettings` separately.
   */
  applyEditorWithFile(config: EditorSettingsWithFile): Promise<void>;

  /**
   * Returns the current clipboard snapshot captured by `setupClipboardMocking()`.
   * Returns `null` when nothing has been copied yet.
   */
  getClipboardContent(): Promise<ClipboardSnapshot | null>;

  /**
   * Returns the raw visible text inside the highlighted-code block.
   * Prefer `expect(locator).toContainText(...)` in tests when possible.
   */
  getHighlightedCodeText(): Promise<string>;
}

// ---------------------------------------------------------------------------
// Combined page type
// ---------------------------------------------------------------------------

export type CodeHighlighterPage = Page & {
  actions: CodeHighlighterActions;
  assertions: CodeHighlighterAssertions;
  utils: CodeHighlighterUtils;
};
