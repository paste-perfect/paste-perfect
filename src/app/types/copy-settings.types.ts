/**
 * Defines how code is copied to the clipboard.
 */
export enum CopyMode {
  /** Copy with full HTML syntax highlighting and inline styles (default). */
  HTML = "HTML",
  /** Copy as plain, unformatted text. */
  PlainText = "PLAIN_TEXT",
}

/**
 * Settings that control copy-to-clipboard behaviour.
 *
 * These settings are intentionally NOT persisted to localStorage and always
 * reset to their defaults on each page load.
 */
export interface CopySettings {
  /** Whether to copy as rich HTML or plain text. */
  readonly copyMode: CopyMode;
  /** Font size in pixels applied to both the display and the HTML copy output. */
  readonly fontSize: number;
  /** Visual width of tab characters in the HTML copy output. */
  readonly tabSize: number;
  /** Whether MS Office–specific inline styles (mso-*) are included in the HTML output. */
  readonly inlineStylesForOffice: boolean;
  /** Whether leading indentation is converted to NBSP / tab spans optimised for Office pasting. */
  readonly adjustIndentationForOffice: boolean;
}

/**
 * Descriptor for an active (non-default) copy setting shown as a chip in the result header.
 */
export interface CopySettingChip {
  readonly label: string;
  readonly key: keyof CopySettings;
}

/** Default font size in pixels. */
export const DEFAULT_COPY_FONT_SIZE = 14;

/** Default visual tab size (number of spaces per tab). */
export const DEFAULT_COPY_TAB_SIZE = 4;

/** Factory defaults — used for comparison and reset. */
export const DEFAULT_COPY_SETTINGS: CopySettings = {
  copyMode: CopyMode.HTML,
  fontSize: DEFAULT_COPY_FONT_SIZE,
  tabSize: DEFAULT_COPY_TAB_SIZE,
  inlineStylesForOffice: true,
  adjustIndentationForOffice: true,
} as const;
