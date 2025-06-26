import { INDENTATION_MODE_MAP } from "@constants";

/**
 * Represents a selectable indentation mode.
 */
export interface SelectableIndentationMode {
  /** The key representing the indentation mode label. */
  readonly label: IndentationModeKey;
  /** The corresponding indentation mode value. */
  readonly value: IndentationModeValue;
}

/**
 * Represents the key of an indentation mode from the INDENTATION_MODE_MAP object.
 */
export type IndentationModeKey = keyof typeof INDENTATION_MODE_MAP;

/**
 * Represents the value of an indentation mode from the INDENTATION_MODE_MAP object.
 */
export type IndentationModeValue = (typeof INDENTATION_MODE_MAP)[IndentationModeKey];

/**
 * Represents the settings for syntax highlighting.
 */
export interface HighlightingSettings {
  /** Number of spaces or tab width for indentation */
  readonly indentationSize: number;
  /** Selected indentation mode (spaces, tabs, or NBSP) */
  readonly indentationMode: IndentationModeValue;
  /** Whether code formatting is enabled */
  readonly enableFormatting: boolean;
}
