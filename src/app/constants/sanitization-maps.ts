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

  // Single quotation marks
  [SpecialCharacters.LEFT_SINGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // ' -> '
  [SpecialCharacters.RIGHT_SINGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // ' -> '
  [SpecialCharacters.SINGLE_LOW_9_QUOTE]: SpecialCharacters.APOSTROPHE, // ‚ -> '
  [SpecialCharacters.SINGLE_HIGH_REVERSED_9_QUOTE]: SpecialCharacters.APOSTROPHE, // ‛ -> '

  // Double quotation marks
  [SpecialCharacters.LEFT_DOUBLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // " -> "
  [SpecialCharacters.RIGHT_DOUBLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // " -> "
  [SpecialCharacters.DOUBLE_LOW_9_QUOTE]: SpecialCharacters.QUOTATION_MARK, // „ -> "
  [SpecialCharacters.DOUBLE_HIGH_REVERSED_9_QUOTE]: SpecialCharacters.QUOTATION_MARK, // ‟ -> "

  // Additional quotation marks
  [SpecialCharacters.LEFT_ANGLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // « -> "
  [SpecialCharacters.RIGHT_ANGLE_QUOTE]: SpecialCharacters.QUOTATION_MARK, // » -> "
  [SpecialCharacters.SINGLE_LEFT_ANGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // ‹ -> '
  [SpecialCharacters.SINGLE_RIGHT_ANGLE_QUOTE]: SpecialCharacters.APOSTROPHE, // › -> '

  // Prime marks (often used as quotation marks)
  [SpecialCharacters.PRIME]: SpecialCharacters.APOSTROPHE, // ′ -> '
  [SpecialCharacters.DOUBLE_PRIME]: SpecialCharacters.QUOTATION_MARK, // ″ -> "
  [SpecialCharacters.TRIPLE_PRIME]: SpecialCharacters.QUOTATION_MARK, // ‴ -> "
  [SpecialCharacters.REVERSED_PRIME]: SpecialCharacters.APOSTROPHE, // ‵ -> '
  [SpecialCharacters.REVERSED_DOUBLE_PRIME]: SpecialCharacters.QUOTATION_MARK, // ‶ -> "
  [SpecialCharacters.REVERSED_TRIPLE_PRIME]: SpecialCharacters.QUOTATION_MARK, // ‷ -> "

  // Add more special character replacements as needed
};

/**
 * A mapping of special characters for output sanitization.
 * This is primarily used for converting characters like newline into appropriate display formats.
 */
export const OUTPUT_SANITIZE_MAP: Partial<Record<SpecialCharacters, SpecialCharacters>> = {
  // [SpecialCharacters.NEWLINE]: SpecialCharacters.LINE_BREAK, // Newline -> <br>
  // Add more output replacements as needed
};

/**
 * A map for replacing German umlauts and the eszett character with their ASCII representations.
 */
export const UMLAUT_REPLACEMENT_MAP: Record<string, string> = {
  Ä: "AE",
  ä: "ae",
  Ö: "OE",
  ö: "oe",
  Ü: "UE",
  ü: "ue",
  ẞ: "SS",
  ß: "ss",
};
