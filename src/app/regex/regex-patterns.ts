import { SpecialCharacters } from "../constants";
import { RegexFlags } from "./regex-flags";

export class RegexPatterns {
  /**
   * List of whitespace characters including space and non-breaking space.
   */
  private static WHITESPACE_CHARS: string[] = [SpecialCharacters.SPACE, SpecialCharacters.NON_BREAKING_SPACE];
  /**
   * List of tab characters, currently including only the tab character "\t".
   */
  public static TAB_CHARS: string[] = ["\t"];
  /**
   * A string representation of the whitespace characters, used for regex pattern construction.
   */
  public static WHITESPACE_PATTERN: string = this.WHITESPACE_CHARS.join("");
  /**
   * A string representation of the tab characters, used for regex pattern construction.
   */
  public static TAB_PATTERN: string = this.TAB_CHARS.join("");
  /**
   * Regular expression to match any whitespace character (space, non-breaking space).
   */
  public static WHITESPACE_REGEX = new RegExp(`[${this.WHITESPACE_PATTERN}]`, RegexFlags.GLOBAL);
  /**
   * Regular expression to match tab characters.
   */
  public static TAB_REGEX = new RegExp(`[${SpecialCharacters.TAB}]`, RegexFlags.GLOBAL);
  /**
   * Regular expression to match the marker character.
   */
  public static MARKER_REGEX = new RegExp(SpecialCharacters.MARKER, RegexFlags.GLOBAL);
  /**
   * Regular expression to match indentation at the beginning of a line, including both whitespace and tab characters.
   */
  public static INDENTATION_REGEX = new RegExp(`^[${this.WHITESPACE_PATTERN}${this.TAB_PATTERN}]+`, RegexFlags.GLOBAL_MULTILINE);
  /**
   * Regular expression to match any non-ASCII character.
   * Matches characters outside the printable ASCII range (0x20 to 0x7E), excluding newline characters.
   */
  public static NON_ASCII_CHARACTERS_REGEX = new RegExp(/[^\x20-\x7E\n\u00A0\t]/g, RegexFlags.GLOBAL);
  /**
   * Regular expression to match blank lines.
   * Matches lines that contain only whitespace or are empty at the beginning or end of a string.
   */
  public static BLANK_LINES_REGEX = new RegExp(/^\s*\n+|\n+\s*$/g, RegexFlags.GLOBAL);

  /**
   * Regular expression to match both Windows (\r\n) and Unix (\n) style newlines.
   */
  public static NEWLINE_REGEX = new RegExp(/\r?\n/, RegexFlags.GLOBAL);

  /**
   * Regular expression to match one or more marker characters at the beginning of a string.
   */
  public static MARKER_ONLY_REGEX = new RegExp(`^${SpecialCharacters.MARKER}+`);
}
