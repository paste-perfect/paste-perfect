import { INDENTATION_MODE_MAP, IndentationMode } from "@constants";

/**
 * Represents a selectable indentation mode.
 */
export interface SelectableIndentationMode {
  /** The key representing the indentation mode value. */
  readonly value: IndentationMode;
  /** The corresponding indentation mode label. */
  readonly label: IndentationModeLabel;
}

/**
 * Represents the value of an indentation mode from the INDENTATION_MODE_MAP object.
 */
export type IndentationModeLabel = (typeof INDENTATION_MODE_MAP)[IndentationMode];

/**
 * Represents the settings for syntax highlighting.
 */
export interface HighlightingSettings {
  /** Number of spaces or tab width for indentation */
  readonly indentationSize: number;
  /** Selected indentation mode (spaces, tabs, or NBSP) */
  readonly indentationMode: IndentationMode;
  /** Whether code formatting is enabled */
  readonly enableFormatting: boolean;
}
