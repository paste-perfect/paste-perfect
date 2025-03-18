import { getEntries } from "@utils/utils";
import { INPUT_SANITIZE_MAP, OUTPUT_SANITIZE_MAP, SpecialCharacters } from "../constants";
import { RegexFlags } from "../regex/regex-flags";
import { RegexPatterns } from "../regex/regex-patterns";

/**
 * Provides methods to sanitize input and output strings by replacing or removing unwanted characters.
 *
 * This class ensures proper formatting and security by:
 * - Replacing specified characters based on predefined mappings.
 * - Removing non-ASCII characters when sanitizing input.
 * - Cleaning up unnecessary blank lines in input.
 */
export class SanitizerWrapper {
  /**
   * Sanitizes an input string by replacing mapped characters and removing non-ASCII characters.
   *
   * @param {string} input - The input string to sanitize.
   * @returns {string} - The sanitized string with replacements applied and unwanted characters removed.
   */
  public static sanitizeInput(input: string): string {
    // Replace mapped characters first
    getEntries(INPUT_SANITIZE_MAP).forEach(([key, value]) => {
      input = input.replace(new RegExp(key, RegexFlags.GLOBAL), value as SpecialCharacters);
    });

    return (
      input
        // Remove all non-ASCII characters except mapped ones
        .replace(RegexPatterns.NON_ASCII_CHARACTERS_REGEX, "")
        // Remove leading and trailing blank lines
        .replace(RegexPatterns.BLANK_LINES_REGEX, "")
    );
  }

  /**
   * Sanitizes an output string by replacing mapped characters (e.g., newlines to HTML <br> tags).
   *
   * @param {string} output - The output string to sanitize.
   * @returns {string} - The sanitized output string with proper replacements.
   */
  public static sanitizeOutput(output: string): string {
    getEntries(OUTPUT_SANITIZE_MAP).forEach(([key, value]) => {
      output = output.replace(new RegExp(key, RegexFlags.GLOBAL), value as SpecialCharacters);
    });
    return output;
  }
}
