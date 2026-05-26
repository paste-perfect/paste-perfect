import { inject, Injectable } from "@angular/core";
import * as Prism from "prismjs";

import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { LinesCollector } from "@utils/line-collector";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { SettingsService } from "@services/settings.service";
import { CopySettingsService } from "@services/copy-settings.service";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { SanitizerWrapper } from "@utils/sanitizer";
import { HTML_CODE_PRE_SELECTOR } from "@constants/const";
import { CopyMode, DEFAULT_COPY_FONT_SIZE } from "@types";

/**
 * A service responsible for syntax highlighting and clipboard copying of code snippets.
 * Uses Prism.js for syntax highlighting and applies minimal inline styles for clipboard copying.
 */
@Injectable({
  providedIn: "root",
})
export class PrismHighlightService {
  /**
   * Service for managing the highlighting settings.
   */
  private settingsService: SettingsService = inject(SettingsService);

  /**
   * Service for managing copy-to-clipboard behaviour settings.
   */
  private copySettingsService: CopySettingsService = inject(CopySettingsService);

  /**
   * Service for loading the required prism languages dynamically.
   */
  private prismLanguageLoaderService: PrismLanguageLoaderService = inject(PrismLanguageLoaderService);

  /**
   * PrimeNGs messages service for displaying toasts to the user
   */
  private messageService: MessageService = inject(MessageService);

  /**
   * Highlights a code snippet using Prism.js.
   *
   * @param code The raw code to highlight.
   * @param language The language for syntax highlighting.
   * @returns A Promise resolving to an HTML string with syntax-highlighted code.
   */
  public async highlightCode(code: string, language: LanguageDefinition): Promise<string> {
    // Replace vertical tabs with a newline if needed
    const sanitizedCode = SanitizerWrapper.sanitizeInput(code);

    const grammarId = language.prismConfiguration.grammar;

    if (!Prism.languages[grammarId]) {
      // Load prism language if it hasn't already been loaded before
      await this.prismLanguageLoaderService.loadPrismLanguage(language);
    }

    // Use Prism to highlight
    return Prism.highlight(sanitizedCode, Prism.languages[grammarId], language.value);
  }

  /**
   * Copies the currently highlighted code from the DOM into the clipboard.
   *
   * When the copy mode is "HTML (Formatted)", the full preprocessing pipeline is used,
   * producing rich HTML with inline styles. When set to "Native Text (Plain)", only the
   * raw plain-text content is written to the clipboard.
   *
   * Notes:
   * - Looks for the `<pre><code>` snippet in the DOM.
   * - Replaces leading spaces and wraps text nodes so copying preserves indentation.
   */
  public copyToClipboard() {
    const preElement: HTMLPreElement = document.querySelector(HTML_CODE_PRE_SELECTOR) as HTMLPreElement;
    if (!preElement) {
      this.messageService.add({
        severity: "warn",
        summary: "No code available",
        detail: "Please enter some code before copying.",
      });
      return;
    }

    const copySettings = this.copySettingsService.copySettings;

    // Plain-text mode: skip HTML processing entirely.
    if (copySettings.copyMode === CopyMode.PlainText) {
      const textSnippet: string = preElement.outerText;
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/plain": new Blob([textSnippet], { type: "text/plain" }),
          }),
        ])
        .then(() => this.showSuccessToast())
        .catch((err) => this.showErrorToast(err));
      return;
    }

    // 1) Set the font-size override (clear it first if default to avoid stale values)
    const isDefaultFontSize = copySettings.fontSize === DEFAULT_COPY_FONT_SIZE;
    InlineStyleApplier.setFontSizeOverride(isDefaultFontSize ? null : copySettings.fontSize);

    // 2) Preprocess in a single pass
    const processedClone: HTMLPreElement = this.preprocessForClipboard(preElement);

    // 3) Clear the font-size override to not pollute subsequent runs
    InlineStyleApplier.setFontSizeOverride(null);

    // 4) Extract final HTML and plain text
    const htmlSnippet: string = SanitizerWrapper.sanitizeOutput(processedClone.outerHTML);
    // Use the original element for the text-only snippet (non-formatted)
    const textSnippet: string = preElement.outerText;

    // 5) Copy to clipboard in both text/html and text/plain forms
    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": new Blob([htmlSnippet], { type: "text/html" }),
          "text/plain": new Blob([textSnippet], { type: "text/plain" }),
        }),
      ])
      .then(() => this.showSuccessToast())
      .catch((err) => this.showErrorToast(err));
  }

  /**
   * Prepares a cloned `<pre>` element for clipboard copying by applying structural
   * and stylistic transformations in a single pass.
   *
   * Steps performed:
   *  1. Clones the original `<pre>` element.
   *  2. Captures and stores root-level computed styles from the original element.
   *  3. Uses `LinesProcessor` to:
   *     - Traverse both original and cloned nodes in parallel,
   *     - Collect content line-by-line while preserving indentation,
   *     - Apply minimal inline styles to maintain formatting,
   *     - Wrap lines in `<p>` elements and text in `<span>` elements,
   *     - Replace indentation with properly styled visual equivalents.
   *
   * This ensures that the final HTML structure:
   *  - Maintains visual fidelity (color, font, indentation),
   *  - Is optimized for clipboard pasting (including into rich-text editors),
   *  - Does not rely on external CSS.
   *
   * @param originalPre The original `<pre>` DOM element containing the syntax-highlighted code.
   * @returns A fully processed and styled clone of the original `<pre>` element.
   */
  private preprocessForClipboard(originalPre: HTMLPreElement): HTMLPreElement {
    const editorSettings = this.settingsService.editorSettings;
    const copySettings = this.copySettingsService.copySettings;

    const mode = editorSettings.indentationMode;
    // Copy settings tab size overrides the editor's indentation size for the output.
    const tabSize = copySettings.tabSize;
    const showLineNumbers = editorSettings.showLineNumbers;

    // Clone the original element to avoid modifying the source
    const clonedPre: HTMLPreElement = originalPre.cloneNode(true) as HTMLPreElement;

    // Transform the cloned structure for clipboard compatibility
    const linesCollector = new LinesCollector(mode, tabSize, showLineNumbers, {
      inlineStylesForOffice: copySettings.inlineStylesForOffice,
      adjustIndentationForOffice: copySettings.adjustIndentationForOffice,
    });
    linesCollector.collectLinesFromNodes(originalPre, clonedPre);

    return clonedPre;
  }

  private showSuccessToast(): void {
    this.messageService.add({
      severity: "success",
      summary: "Copied successfully",
      detail: "The code has been copied to your clipboard.",
    });
  }

  private showErrorToast(err: unknown): void {
    this.messageService.add({
      severity: "error",
      summary: "Copy failed",
      detail: "An error occurred while copying the code. Please try again.",
    });
    console.error("Failed to copy:", err);
  }
}
