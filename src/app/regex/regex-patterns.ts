import { SpecialCharacters } from "@constants";
import { RegexFlags } from "./regex-flags";

export class RegexPatterns {
  /**
   * Placeholder string used within line number templates.
   * This string will be replaced with actual line number values during pattern generation.
   */
  public static readonly LINE_NUMBER_PLACEHOLDER: string = "{lineNumber}";
  /**
   * Line number template pattern for generating numbered list items.
   * Format: "{lineNumber}. " where {lineNumber} will be replaced with the actual number.
   * Example: "1. ", "2. ", "3. " etc.
   */
  public static readonly LINE_NUMBER_TEMPLATE: string = `${RegexPatterns.LINE_NUMBER_PLACEHOLDER}. `;
  /**
   * Padding character for line number alignment.
   */
  public static readonly LINE_NUMBER_PADDING_CHAR: SpecialCharacters = SpecialCharacters.SPACE;
  /**
   * List of whitespace characters including space and non-breaking space.
   */
  private static readonly WHITESPACE_CHARS: string[] = [SpecialCharacters.SPACE, SpecialCharacters.NON_BREAKING_SPACE];
  /**
   * List of tab characters, currently including only the tab character "\t".
   */
  public static readonly TAB_CHARS: string[] = ["\t"];
  /**
   * A string representation of the whitespace characters, used for regex pattern construction.
   */
  public static readonly WHITESPACE_PATTERN: string = this.WHITESPACE_CHARS.join("");
  /**
   * A string representation of the tab characters, used for regex pattern construction.
   */
  public static readonly TAB_PATTERN: string = this.TAB_CHARS.join("");
  /**
   * Regular expression to match any whitespace character (space, non-breaking space).
   */
  public static readonly WHITESPACE_REGEX = new RegExp(`[${this.WHITESPACE_PATTERN}]`, RegexFlags.GLOBAL);
  /**
   * Regular expression to match tab characters.
   */
  public static readonly TAB_REGEX = new RegExp(`[${SpecialCharacters.TAB}]`, RegexFlags.GLOBAL);
  /**
   * Regular expression to match the marker character.
   */
  public static readonly MARKER_REGEX = new RegExp(SpecialCharacters.MARKER, RegexFlags.GLOBAL);
  /**
   * Regular expression to match indentation at the beginning of a line, including both whitespace and tab characters.
   */
  public static readonly INDENTATION_REGEX = new RegExp(`^[${this.WHITESPACE_PATTERN}${this.TAB_PATTERN}]+`, RegexFlags.GLOBAL_MULTILINE);
  /**
   * Regular expression to match any non-ASCII character.
   * Matches characters outside the printable ASCII range (0x20 to 0x7E), excluding newline characters.
   */
  public static readonly NON_ASCII_CHARACTERS_REGEX = new RegExp(/[^\x20-\x7E\n\u00A0\t]/g, RegexFlags.GLOBAL);
  /**
   * Regular expression to match blank lines.
   * Matches lines that contain only whitespace or are empty at the beginning or end of a string.
   */
  public static readonly BLANK_LINES_REGEX = new RegExp(/^\s*\n+|\n+\s*$/g, RegexFlags.GLOBAL);

  /**
   * Regular expression to match both Windows (\r\n) and Unix (\n) style newlines.
   */
  public static readonly NEWLINE_REGEX = new RegExp(/\r?\n/, RegexFlags.GLOBAL);

  /**
   * Regular expression to match one or more marker characters at the beginning of a string.
   */
  public static readonly MARKER_ONLY_REGEX = new RegExp(`^${SpecialCharacters.MARKER}+`);

  /**
   * Regular expression to match line numbers with optional leading whitespace.
   * Matches optional whitespace followed by digits, a period, and a space.
   */
  public static readonly LEADING_LINE_NUMBER_REGEX = new RegExp(
    `^[${this.WHITESPACE_PATTERN}]*(${this.LINE_NUMBER_TEMPLATE.replace(RegexPatterns.LINE_NUMBER_PLACEHOLDER, "\\d+")})`
  );
}
