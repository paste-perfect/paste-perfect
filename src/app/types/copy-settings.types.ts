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
 * These settings are persisted to sessionStorage — they survive within a
 * single browser tab session but reset when the tab/window is closed.
 */
export interface CopySettings {
  /** Whether to copy as rich HTML or plain text. */
  readonly copyMode: CopyMode;
  /** Font size in pixels applied to the HTML copy output (not the display). */
  readonly fontSize: number;
  /** Tab width in centimeters (cm) for MS Office tab stops. Only used when copying to clipboard. */
  readonly officeTabSizeCm: number;
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

/** Default office tab width in centimeters (cm). */
export const DEFAULT_OFFICE_TAB_SIZE_CM = 1;

/** Factory defaults — used for comparison and reset. */
export const DEFAULT_COPY_SETTINGS: CopySettings = {
  copyMode: CopyMode.HTML,
  fontSize: DEFAULT_COPY_FONT_SIZE,
  officeTabSizeCm: DEFAULT_OFFICE_TAB_SIZE_CM,
  inlineStylesForOffice: true,
  adjustIndentationForOffice: true,
} as const;
