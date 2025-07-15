/** Enum containing special characters */
export enum SpecialCharacters {
  APOSTROPHE = "'",
  EN_DASH = "\u2013",
  EM_DASH = "\u2014",
  EMPTY_STRING = "",
  HYPHEN = "-",
  LINE_BREAK = "<br>",
  MARKER = "\u001F",
  NEWLINE = "\n",
  NON_BREAKING_SPACE = "\u00A0",
  PARAGRAPH_TAG = "p",
  QUOTATION_MARK = '"',
  SOFT_HYPHEN = "\u00AD",
  SPACE = "\u0020",
  SPAN_TAG = "span",
  STYLE_TAG = "style",
  TAB = "\t",
  VERTICAL_TAB = "\u000b",
  ZERO_WIDTH_SPACE = "\u200B",

  // Single quotation marks
  LEFT_SINGLE_QUOTE = "\u2018", // '
  RIGHT_SINGLE_QUOTE = "\u2019", // '
  SINGLE_LOW_9_QUOTE = "\u201A", // ‚
  SINGLE_HIGH_REVERSED_9_QUOTE = "\u201B", // ‛

  // Double quotation marks
  LEFT_DOUBLE_QUOTE = "\u201C", // "
  RIGHT_DOUBLE_QUOTE = "\u201D", // "
  DOUBLE_LOW_9_QUOTE = "\u201E", // „
  DOUBLE_HIGH_REVERSED_9_QUOTE = "\u201F", // ‟

  // Additional quotation marks
  LEFT_ANGLE_QUOTE = "\u00AB", // «
  RIGHT_ANGLE_QUOTE = "\u00BB", // »
  SINGLE_LEFT_ANGLE_QUOTE = "\u2039", // ‹
  SINGLE_RIGHT_ANGLE_QUOTE = "\u203A", // ›

  // Prime marks
  PRIME = "\u2032", // ′
  DOUBLE_PRIME = "\u2033", // ″
  TRIPLE_PRIME = "\u2034", // ‴
  REVERSED_PRIME = "\u2035", // ‵
  REVERSED_DOUBLE_PRIME = "\u2036", // ‶
  REVERSED_TRIPLE_PRIME = "\u2037", // ‷
}
