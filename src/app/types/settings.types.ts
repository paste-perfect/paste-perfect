import { INDENTATION_MODE_MAP } from "../constants";

/**
 * Represents a selectable indentation mode.
 */
export interface AvailableIndentationMode {
  /** The key representing the indentation mode label. */
  label: IndentationModeKey;
  /** The corresponding indentation mode value. */
  value: IndentationModeValue;
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
  /** The size of indentation (number of spaces or tab width). */
  indentationSize: number;
  /** The selected indentation mode (spaces, tabs, or NBSP). */
  indentationMode: IndentationModeValue;
}
