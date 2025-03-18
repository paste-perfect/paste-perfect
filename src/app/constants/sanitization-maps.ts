import { SpecialCharacters } from "./special-characters";

/**
 * A mapping of special characters for input sanitization.
 * Each key represents a special character that needs to be replaced by the corresponding value.
 */
export const INPUT_SANITIZE_MAP: Partial<Record<SpecialCharacters, SpecialCharacters>> = {
  [SpecialCharacters.NON_BREAKING_SPACE]: SpecialCharacters.SPACE, // Non-breaking space -> Normal space
  [SpecialCharacters.VERTICAL_TAB]: SpecialCharacters.NEWLINE, // Vertical tab -> New line
  [SpecialCharacters.SOFT_HYPHEN]: SpecialCharacters.EMPTY_STRING, // Soft hyphen -> Remove
  [SpecialCharacters.ZERO_WIDTH_SPACE]: SpecialCharacters.EMPTY_STRING, // Zero-width space -> Remove
  [SpecialCharacters.EN_DASH]: SpecialCharacters.HYPHEN, // En dash -> Hyphen
  [SpecialCharacters.EM_DASH]: SpecialCharacters.HYPHEN, // Em dash -> Hyphen
  [SpecialCharacters.LEFT_SINGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // ‘ -> '
  [SpecialCharacters.RIGHT_SINGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // ’ -> '
  [SpecialCharacters.LEFT_DOUBLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // “ -> "
  [SpecialCharacters.RIGHT_DOUBLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // ” -> "
  // Add more special character replacements as needed
};

/**
 * A mapping of special characters for output sanitization.
 * This is primarily used for converting characters like newline into appropriate display formats.
 */
export const OUTPUT_SANITIZE_MAP: Partial<Record<SpecialCharacters, SpecialCharacters>> = {
  [SpecialCharacters.NEWLINE]: SpecialCharacters.LINE_BREAK, // Newline -> <br>
  // Add more output replacements as needed
};
