export class SyntaxHighlightConstants {
  static readonly MARKER: string = "\u001F";
  static readonly SPAN_TAG: string = "span";
  static readonly VERTICAL_TAB: string = "\u000b";
  static readonly TAB: string = "\t";
  static readonly NEWLINE: string = "\n";
  static readonly SPACE: string = "\u0020";
  static readonly NON_BREAKING_SPACE: string = "\u00A0";
  static readonly LINE_BREAK: string = "<br>";
  static readonly REGEX_GLOBAL_FLAG: string = "g";

  /**
   * Defines a regex pattern that matches any whitespace character,
   * including standard spaces and non-breaking spaces.
   */
  static readonly WHITESPACE = `[${this.SPACE}${this.NON_BREAKING_SPACE}]`;

  /**
   * Defines a regex pattern that matches zero or more consecutive whitespace characters.
   */
  static readonly OPTIONAL_WHITESPACE = `${this.WHITESPACE}*`;

  /**
   * Defines a regex pattern that matches one or more consecutive whitespace characters.
   */
  static readonly REQUIRED_WHITESPACE = `${this.WHITESPACE}+`;

  /**
   * Matches a tab character that appears after a newline and any optional leading whitespace.
   * Utilizes a lookbehind assertion to ensure the tab follows a newline sequence.
   */
  static readonly TAB_AFTER_NEW_LINE_REGEX = new RegExp(
    `(?<=${this.OPTIONAL_WHITESPACE})${this.TAB}`,
    this.REGEX_GLOBAL_FLAG
  );

  /**
   * Matches spaces appearing after a newline or a specific marker.
   * The pattern captures both the preceding marker (if present) and the trailing spaces separately.
   */
  static readonly SPACES_AFTER_NEW_LINE_REGEX = new RegExp(
    `(|${this.MARKER})(${this.REQUIRED_WHITESPACE})`,
    this.REGEX_GLOBAL_FLAG
  );

  /**
   * Matches leading whitespace (spaces or non-breaking spaces) before a tab at the start of a line.
   * Used to identify indentation patterns that combine spaces and tabs.
   */
  static readonly LEADING_TAB_REGEX = new RegExp(
    `^${this.WHITESPACE}*${this.TAB}`,
    this.REGEX_GLOBAL_FLAG
  );

  /**
   * Matches leading spaces or a marker at the beginning of a line.
   * Helps differentiate indentation that consists purely of spaces or begins with a specific marker.
   */
  static readonly LEADING_SPACES_REGEX = new RegExp(
    `^(${this.MARKER}|${this.REQUIRED_WHITESPACE})`,
    this.REGEX_GLOBAL_FLAG
  );
}
