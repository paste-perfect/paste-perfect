import { RegexPatterns } from "../regex/regex-patterns";
import { SpecialCharacters } from "@constants";
import { RegexFlags } from "../regex/regex-flags";

/**
 * Utility for masking and formatting code indentation.
 *
 * Converts leading spaces/tabs to markers and vice versa,
 * useful for preserving formatting in highlighted or rendered code.
 */
export class IndentationFormatter {
  /**
   * Masks leading spaces and tabs with special markers.
   *
   * @param text - Code input.
   * @param tabSize - Number of markers to represent a tab.
   * @returns Text with indentation replaced by markers.
   */
  public static maskIndentation(text: string, tabSize: number): string {
    return text.replace(RegexPatterns.INDENTATION_REGEX, (match: string): string =>
      match
        // Replace all leading spaces
        .replace(RegexPatterns.WHITESPACE_REGEX, SpecialCharacters.MARKER)
        // Replace all leading tabs
        .replace(RegexPatterns.TAB_REGEX, SpecialCharacters.MARKER.repeat(tabSize))
    );
  }

  /**
   * Replaces markers with tabs for display.
   *
   * @param text - Text with masked indentation.
   * @param {number} tabSize - How many markers constitute one tab.
   * @returns Text with visual indentation restored.
   */
  public static unmaskIndentationWithTabs(text: string, tabSize: number): string {
    // Create a RegExp to match sequences of marker characters
    const groupRegex = new RegExp(`(${SpecialCharacters.MARKER}{${tabSize}})`, RegexFlags.GLOBAL);

    // Step 1: Replace every group of tabSize markers with one tab
    let result = text.replace(groupRegex, SpecialCharacters.TAB);

    // Step 2: Replace any remaining markers with spaces
    result = result.replace(RegexPatterns.MARKER_REGEX, SpecialCharacters.SPACE);

    return result;
  }

  /**
   * Replaces markers with non-breaking spaces for display.
   *
   * @param text - Text with masked indentation.
   * @returns Text with visual indentation restored.
   */
  public static unmaskIndentationWithNbsp(text: string): string {
    return text.replace(RegexPatterns.MARKER_REGEX, SpecialCharacters.NON_BREAKING_SPACE);
  }
}
