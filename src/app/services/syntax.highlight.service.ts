import { computed, inject, Injectable, Signal } from "@angular/core";
import * as Prism from "prismjs";

import { INDENTATION_MODE_MAP, SyntaxHighlightConstants as SHC } from "@const";
import { SettingsService } from "./settings.service";
import { MessageService } from "primeng/api";
import { getEntries } from "@utils/utils";
import {
  IndentationModeValue,
  LanguageDefinition,
  StyleProperties,
} from "@types";
import { PrismLangLoaderService } from "@services/prism-lang-loader.service";

/**
 * A service responsible for syntax highlighting and clipboard copying of code snippets.
 * Uses Prism.js for syntax highlighting and applies minimal inline styles for clipboard copying.
 */
@Injectable({
  providedIn: "root",
})
export class SyntaxHighlightService {
  /**
   * Service for managing the highlighting settings.
   */
  private settingsService: SettingsService = inject(SettingsService);

  /**
   * Service for loading the required prism languages dynamically.
   */
  private prismLanguageLoaderService: PrismLangLoaderService = inject(
    PrismLangLoaderService
  );

  /**
   * PrimeNGs messages service for displaying toasts to the user
   */
  private messageService: MessageService = inject(MessageService);

  /**
   * Signal representing the current indentation mode (e.g., tabs or spaces).
   */
  private mode: Signal<IndentationModeValue> = computed(
    () => this.settingsService.editorSettings.indentationMode
  );

  /**
   * Signal representing the current tab size setting.
   */
  private tabSize: Signal<number> = computed(
    () => this.settingsService.editorSettings.indentationSize
  );

  /**
   * CSS selector for the parent `<pre>` element wrapping the highlighted code.
   */
  private readonly HTML_CODE_PRE_SELECTOR: string =
    "pre#highlighted-code-wrapper";

  /**
   * CSS selector for the `<code>` element containing the highlighted code.
   */
  private readonly HTML_CODE_SELECTOR: string = "code.highlighted-code";

  /**
   * By default, we only copy these font-related styles inline for the final snippet.
   * We do not copy background color or other layout styles.
   */
  private readonly RELEVANT_STYLE_PROPERTIES: StyleProperties = {
    color: "rgba(0, 0, 0)", // or undefined if you'd prefer not to default
    "font-family": undefined, // specify a default or keep it undefined
    "font-size": "16px",
    "font-style": "normal",
    "font-variant": "normal",
    "font-weight": "400",
  };

  /**
   * Stores computed style properties from the root node for child elements.
   */
  private rootStyleProperties: StyleProperties = {};

  /**
   * Highlights a code snippet using Prism.js.
   *
   * @param code The raw code to highlight.
   * @param language The language for syntax highlighting.
   * @returns A Promise resolving to an HTML string with syntax-highlighted code.
   */
  public async highlightCode(
    code: string,
    language: LanguageDefinition
  ): Promise<string> {
    // Replace vertical tabs with a newline if needed
    const sanitizedCode = code.replace(
      new RegExp(SHC.VERTICAL_TAB, SHC.REGEX_GLOBAL_FLAG),
      SHC.NEWLINE
    );

    if (!Prism.languages[language.value]) {
      // Load prism language if it hasn't already been loaded before
      await this.prismLanguageLoaderService.loadPrismLanguage(language);
    }

    // Use Prism to highlight
    return Prism.highlight(
      sanitizedCode,
      Prism.languages[language.value],
      language.value
    );
  }

  /**
   * Copies the currently highlighted code from the DOM into the clipboard,
   * including minimal inline styling (such as color and font settings).
   *
   * Notes:
   * - Looks for the `<pre><code>` snippet in the DOM.
   * - Replaces leading spaces and wraps text nodes so copying preserves indentation.
   */
  public copyToClipboard() {
    const codeContainer = document.querySelector(
      this.HTML_CODE_PRE_SELECTOR
    ) as HTMLPreElement;
    if (!codeContainer) {
      this.messageService.add({
        severity: "warn",
        summary: "No code available",
        detail: "Please enter some code before copying.",
      });
      return;
    }

    // Clone the node
    const clonedElement = codeContainer.cloneNode(true) as HTMLPreElement;

    // Fix leading spaces in the first text node
    this.normalizeFirstCodeBlockIndentation(clonedElement);

    // Wrap all text nodes in a span element so that we can apply inline styles
    this.wrapTextNodesWithSpan(clonedElement);

    // Apply inline styles to ensure color/font are carried over
    this.applyMinimalInlineStyles(codeContainer, clonedElement, true);

    const { htmlSnippet, textSnippet } = this.replaceMarkers(clonedElement);

    // Write to clipboard in both 'text/html' and 'text/plain' forms
    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": new Blob([htmlSnippet], { type: "text/html" }),
          "text/plain": new Blob([textSnippet], { type: "text/plain" }),
        }),
      ])
      .then(() => {
        this.messageService.add({
          severity: "success",
          summary: "Copied successfully",
          detail: "The code has been copied to your clipboard.",
        });
      })
      .catch((err) => {
        this.messageService.add({
          severity: "error",
          summary: "Copy failed",
          detail: "An error occurred while copying the code. Please try again.",
        });
        console.error("Failed to copy:", err);
      });
  }

  /**
   * Adjusts indentation in the first text node of a `<code>` block,
   * replacing leading spaces and tabs with a marker to standardize formatting.
   *
   * @param node The HTML element containing the `<code>` block to normalize.
   */
  private normalizeFirstCodeBlockIndentation(node: HTMLElement): void {
    const firstCodeBlock: ChildNode | null | undefined = node.querySelector(
      this.HTML_CODE_SELECTOR
    )?.firstChild;
    if (!this.isTextNode(firstCodeBlock)) return;

    const textContent: string | null = firstCodeBlock.textContent;
    if (textContent) {
      firstCodeBlock.textContent = textContent
        // Replace tabs at the beginning of a line with a marker
        .replace(SHC.LEADING_TAB_REGEX, SHC.MARKER)
        // Replace leading spaces (excluding tabs) with markers
        .replace(SHC.LEADING_SPACES_REGEX, (match) =>
          this.convertSpacesToMarkers("", match)
        );
    }
  }

  /**
   * Recursively traverses and processes child nodes, wrapping text nodes inside `<span>` elements.
   *
   * @param node - The node whose children are being processed.
   */
  private wrapTextNodesWithSpan(node: Node): void {
    Array.from(node.childNodes).forEach((child) => {
      if (this.isTextNode(child)) {
        if (!this.isInsideSpan(child)) {
          // Wrap the text node in a `<span>`
          const wrapped = this.wrapTextWithSpan(child as Text);
          node.replaceChild(wrapped, child);
        } else {
          // If already inside a `<span>`, convert leading spaces to non-breaking spaces
          child.nodeValue = this.replaceLeadingWhitespaceWithMarkers(
            child.nodeValue
          );
        }
      } else if (this.isHtmlElement(child)) {
        // Recursively process child elements
        this.wrapTextNodesWithSpan(child);
      }
    });
  }

  /**
   * Wraps the given Text node inside a `<span>`, replacing
   * leading spaces after newlines with non-breaking spaces.
   */
  private wrapTextWithSpan(textNode: Text): HTMLElement {
    const span = document.createElement(SHC.SPAN_TAG);
    span.textContent = this.replaceLeadingWhitespaceWithMarkers(
      textNode.nodeValue
    );
    return span;
  }

  /**
   * Normalizes leading whitespace by replacing tabs and spaces with predefined markers.
   *
   * - Tabs that follow a newline are replaced with a marker.
   * - Groups of spaces after a newline are transformed into markers or preserved as spaces based on formatting rules.
   *
   * @param text The input string to process.
   * @returns A modified string with leading whitespace normalized into markers.
   */
  private replaceLeadingWhitespaceWithMarkers(text?: string | null): string {
    if (!text) return "";

    return (
      text
        // Replace tabs that appear after a newline with a marker
        .replace(SHC.TAB_AFTER_NEW_LINE_REGEX, SHC.MARKER)
        // Replace sequences of spaces (excluding tabs) appearing after a newline
        .replace(SHC.SPACES_AFTER_NEW_LINE_REGEX, (_, prefix, spaces) =>
          this.convertSpacesToMarkers(prefix, spaces)
        )
    );
  }

  /**
   * Converts groups of spaces into markers based on the tab size, ensuring alignment consistency.
   *
   * - Spaces are grouped into marker units equivalent to tab size.
   * - Any remaining spaces (less than a full marker unit) are preserved as spaces.
   *
   * @param prefix Optional prefix before spaces (e.g., a marker or other leading characters).
   * @param spaces The sequence of spaces to be converted.
   * @returns A formatted string where spaces are replaced with markers and non-breaking spaces as needed.
   */
  private convertSpacesToMarkers(prefix: string, spaces: string): string {
    const count: number = Math.floor(spaces.length / this.tabSize());
    const remainder: number = spaces.length % this.tabSize();
    // Find out the remainder symbol, defaults to space but when the mode is NBSP, we want to use NBSP
    const remainderSymbol: string =
      this.mode() === INDENTATION_MODE_MAP.NBSP
        ? SHC.NON_BREAKING_SPACE
        : SHC.SPACE;
    return (
      prefix + SHC.MARKER.repeat(count) + remainderSymbol.repeat(remainder)
    );
  }

  /**
   * Recursively applies minimal inline font styling (color, font-size, etc.) from the original node to the cloned node.
   * Only properties specified in `RELEVANT_STYLE_PROPERTIES` are considered to avoid excessive inline styles.
   * Default styles from the root are also checked to prevent unnecessary re-application of inherent styles.
   *
   * @param original - The original DOM node to extract computed styles from.
   * @param cloned - The cloned DOM node to apply styles to.
   * @param [isRoot=false] - Indicates if this is the top-level call (used to store root styles).
   */
  private applyMinimalInlineStyles(
    original: Node,
    cloned: Node,
    isRoot = false
  ): void {
    if (isRoot) {
      // Reset root-level styles
      this.rootStyleProperties = {};
    }

    if (this.isHtmlElement(original) && this.isHtmlElement(cloned)) {
      this.applyElementStyles(original, cloned, isRoot);
    } else if (this.isHtmlElement(cloned) && !isRoot) {
      this.applyStoredRootStyles(cloned);
    }

    // Recursively apply styles to child nodes
    Array.from(cloned.childNodes).forEach((child, index) => {
      if (this.isHtmlElement(child)) {
        this.applyMinimalInlineStyles(original.childNodes[index], child);
      }
    });
  }

  /**
   * Applies computed styles from the original element to the cloned element.
   * Removes classes (since only inline styles are copied) and applies relevant styles.
   *
   * @param original - The original HTML element from which styles are extracted.
   * @param cloned - The cloned HTML element to which styles will be applied.
   * @param isRoot - Boolean indicating if this element is the root.
   */
  private applyElementStyles(
    original: HTMLElement,
    cloned: HTMLElement,
    isRoot: boolean
  ): void {
    // Remove classes as they are useless (because only inline styles are copied to clipboard, no stylesheets)
    cloned.removeAttribute("class");

    // Retrieve computed style for the original element
    const computedStyle = window.getComputedStyle(original);

    // Apply only relevant styles
    getEntries(this.RELEVANT_STYLE_PROPERTIES).forEach(
      ([propKey, defaultValue]) => {
        const value = computedStyle.getPropertyValue(propKey);

        if (isRoot) {
          // Store root-level styles for later use in child elements
          this.rootStyleProperties[propKey] = value;
        }

        // Apply style only if it's different from the default
        if (value && value !== String(defaultValue)) {
          cloned.style.setProperty(propKey, value);
        }
      }
    );
  }

  /**
   * Applies stored root-level styles to an element.
   *
   * @param element - The element HTML element to which stored styles will be applied.
   */
  private applyStoredRootStyles(element: HTMLElement): void {
    // Apply stored root properties to non-root elements
    getEntries(this.rootStyleProperties).forEach(([propKey, propValue]) => {
      if (propValue && propValue !== this.RELEVANT_STYLE_PROPERTIES[propKey])
        element.style.setProperty(propKey, propValue);
    });
  }

  /**
   * Replaces special markers in highlighted code to ensure correct indentation formatting.
   *
   * @param node The highlighted code container.
   * @returns An object containing formatted HTML and text snippets.
   */
  private replaceMarkers(node: HTMLElement) {
    // Convert `\n` to <br> in HTML for the final snippet
    let htmlSnippet = node.outerHTML.replace(
      new RegExp(SHC.NEWLINE, SHC.REGEX_GLOBAL_FLAG),
      SHC.LINE_BREAK
    );
    let textSnippet = node.outerText; // plain text fallback

    let replacementSymbol;
    if (this.mode() === INDENTATION_MODE_MAP.Tabs) {
      replacementSymbol = SHC.TAB;
    } else if (this.mode() === INDENTATION_MODE_MAP.Spaces) {
      replacementSymbol = SHC.SPACE.repeat(this.tabSize());
    } else {
      // INDENTATION_MODE_MAP.NON_BREAKING_SPACES
      replacementSymbol = SHC.NON_BREAKING_SPACE.repeat(this.tabSize());
    }

    const multipleMarkerRegex = new RegExp(
      `${SHC.MARKER}`,
      SHC.REGEX_GLOBAL_FLAG
    );

    htmlSnippet = htmlSnippet.replace(multipleMarkerRegex, replacementSymbol);
    textSnippet = textSnippet.replace(multipleMarkerRegex, replacementSymbol);

    return { htmlSnippet, textSnippet };
  }

  /** Determines if the given node is an HTMLElement. */
  private isHtmlElement(node?: Node | null): node is HTMLElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
  }

  /** Determines if the given node is a Text node. */
  private isTextNode(node?: Node | null): node is Text {
    return !!node && node.nodeType === Node.TEXT_NODE;
  }

  /** Checks if the given node is inside a `<span>`. */
  private isInsideSpan(node: Node): boolean {
    let parent: ParentNode | null = node.parentNode;
    while (parent) {
      if (parent.nodeName.toLowerCase() === SHC.SPAN_TAG) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }
}
