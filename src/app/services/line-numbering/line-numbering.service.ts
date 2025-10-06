import { RegexPatterns } from "../../regex/regex-patterns";
import { SettingsService } from "@services/settings.service";
import { inject, Injectable } from "@angular/core";
import { SpecialCharacters } from "@constants";

/**
 * A service responsible for adding line numbers to code blocks.
 */
@Injectable({
  providedIn: "root",
})
export class LineNumberingService {
  private static readonly LINE_NUMBER_CLASSES: string = "token comment line-number";

  /** Service for accessing user settings */
  private readonly settingsService: SettingsService = inject(SettingsService);

  public static getLineNumberWidth(): number {
    return document.getElementsByClassName(LineNumberingService.LINE_NUMBER_CLASSES).item(0)?.getBoundingClientRect().width ?? 0;
  }

  /**
   * Prepends line numbers to each line of the given code string if the
   * 'showLineNumbers' setting is enabled.
   *
   * @param code - The source code to process.
   * @returns The code with line numbers prepended, or the original code if the setting is disabled.
   */
  public prependLineNumbers(code: string): string {
    const settings = this.settingsService.editorSettings;

    // Return original code if the setting is disabled or there's no code
    if (!settings?.showLineNumbers || !code) {
      return code;
    }

    const lines = code.split(RegexPatterns.NEWLINE_REGEX);
    const lineCount = lines.length;
    const totalLineCount = String(lineCount).length;

    const numberedLines = lines.map((line, index) => this.formatLineWithNumber(line, index + 1, totalLineCount));

    return numberedLines.join(SpecialCharacters.NEWLINE);
  }

  /**
   * Formats a single line with its line number.
   *
   * @param line - The code line to format.
   * @param lineNumber - The line number to prepend.
   * @param totalLineCount - The total line count needed for padding.
   * @returns The formatted line with line number prepended.
   */
  private formatLineWithNumber(line: string, lineNumber: number, totalLineCount: number): string {
    const paddedLineNumber = String(lineNumber).padStart(totalLineCount, RegexPatterns.LINE_NUMBER_PADDING_CHAR);
    const formattedLineNumber = RegexPatterns.LINE_NUMBER_TEMPLATE.replace(RegexPatterns.LINE_NUMBER_PLACEHOLDER, paddedLineNumber);
    return `<span class="${LineNumberingService.LINE_NUMBER_CLASSES}">${formattedLineNumber}</span>${line}`;
  }
}
