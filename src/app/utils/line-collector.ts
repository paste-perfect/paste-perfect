import { NodeUtils } from "@utils/node-utils";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { IndentationMode } from "@constants";
import { IndentationFormatter } from "@utils/indentation-formatter";
import { RegexPatterns } from "../regex/regex-patterns";
import { MsOfficeUtils } from "@utils/ms-office-utils";
import { LINE_NUMBER_CLASSES } from "../constants/line-numbering";

/**
 * A utility class that recursively processes an original node and its cloned counterpart,
 * collecting content line-by-line and rebuilding the clone with paragraph elements.
 *
 * This process preserves line structure, handles complex indentation (spaces/tabs),
 * and correctly processes optional line numbers, all while cleaning up node attributes
 * for a clean output suitable for rich text editors like MS Office.
 */
export class LinesCollector {
  private readonly lines: Node[][]; // Stores arrays of Node objects, each representing a single line.
  private readonly tabSize: number;
  private readonly indentationMode: IndentationMode;
  private readonly hasLineNumbers: boolean;
  private readonly lineNumberWidth: number = 0;

  private isLineStart: boolean; // Tracks if we are at the absolute start of a new line.
  private isContentStart: boolean; // Tracks if we are at the start of content, after any line number.
  private maxIndentationMarkers = 0; // Tracks the max indentation for setting tab stops in Office.

  /**
   * @param indentationMode The desired indentation mode (Tabs vs. Spaces).
   * @param tabSize The number of spaces that represent a single tab.
   * @param hasLineNumbers A flag indicating whether to parse leading line numbers.
   */
  constructor(indentationMode: IndentationMode, tabSize: number, hasLineNumbers: boolean) {
    this.lines = [[]];
    this.isLineStart = true;
    this.isContentStart = true;
    this.hasLineNumbers = hasLineNumbers;
    this.tabSize = tabSize;
    this.indentationMode = indentationMode;
    // This width is used to offset tab stops when line numbers are present.
    this.lineNumberWidth = MsOfficeUtils.pxToOfficePt(this.getRenderedLineNumberWidth());
  }

  /**
   * Recursively processes `original` and `cloned` nodes, collecting content
   * into a line buffer. It then rebuilds the cloned node by appending paragraphs for each line.
   *
   * @param original The original Node, used as a reference for styles.
   * @param cloned The cloned Node, which will be cleared and rebuilt.
   */
  public collectLinesFromNodes(original: Node, cloned: Node): void {
    if (NodeUtils.isHtmlElement(cloned)) {
      NodeUtils.removeAllAttributesExceptStyle(cloned);
    }

    // Capture root styles from the original to apply to newly created paragraphs.
    InlineStyleApplier.captureRootStyles(original as HTMLElement);

    const originalChildren = Array.from(original.childNodes);
    const clonedChildren = Array.from(cloned.childNodes);

    originalChildren.forEach((child, index) => {
      this.processNode(child, clonedChildren[index]);
    });

    // Clear any existing content in the cloned node.
    NodeUtils.removeChildren(cloned);

    // Rebuild the cloned node by appending lines as <p> elements.
    this.appendCollectedLinesAsParagraphs(cloned);
  }

  /**
   * Appends each collected line as a `<p>` element to the parent node.
   * For tab-based indentation, it configures MS Office-specific `tab-stops` CSS.
   *
   * @param parent The parent node to receive the new paragraph elements.
   */
  public appendCollectedLinesAsParagraphs(parent: Node): void {
    for (const line of this.lines) {
      const p = NodeUtils.createParagraph();
      InlineStyleApplier.applyStoredRootStyles(p);
      MsOfficeUtils.applyNoMarginStyle(p); // Ensure clean line spacing.

      if (line.length === 0) {
        // For empty lines, append a non-breaking space to ensure the line is rendered.
        p.appendChild(MsOfficeUtils.createEmptyLineSpan());
        parent.appendChild(p);
        continue;
      }

      line.forEach((node) => p.appendChild(node));

      // For tab mode, set up tab stops for proper alignment in MS Office,
      // accounting for the line number width if present.
      if (this.indentationMode === IndentationMode.Tabs) {
        const requiredStops = Math.ceil(this.maxIndentationMarkers / this.tabSize);
        if (requiredStops > 0) {
          const tabStyle = MsOfficeUtils.getTabStops(requiredStops, this.lineNumberWidth);
          NodeUtils.appendInlineStyle(p, tabStyle);
        }
      }

      parent.appendChild(p);
    }
  }

  /**
   * Retrieves the width of the line number element from the live DOM.
   * This is a side-effect and relies on the element being rendered.
   * @returns The width of the line number element, or 0 if not found.
   */
  private getRenderedLineNumberWidth(): number {
    const element = document.getElementsByClassName(LINE_NUMBER_CLASSES)[0];
    return element?.getBoundingClientRect().width ?? 0;
  }

  /**
   * Routes a node to the appropriate handler based on its type.
   */
  private processNode(originalNode: Node, clonedNode: Node): void {
    if (NodeUtils.isTextNode(clonedNode)) {
      this.handleTextNode(originalNode, clonedNode);
    } else if (NodeUtils.isHtmlElement(originalNode) && NodeUtils.isHtmlElement(clonedNode)) {
      this.handleElement(originalNode as HTMLElement, clonedNode as HTMLElement);
    }
    // Other node types (e.g., comments) are ignored.
  }

  /**
   * Processes an HTML element by applying its styles and recursively processing its children.
   */
  private handleElement(originalNode: HTMLElement, clonedNode: HTMLElement): void {
    InlineStyleApplier.applyElementStyles(originalNode, clonedNode);
    NodeUtils.removeAllAttributesExceptStyle(clonedNode);

    const origChildren = Array.from(originalNode.childNodes);
    const clonedChildren = Array.from(clonedNode.childNodes);

    origChildren.forEach((child, index) => {
      this.processNode(child, clonedChildren[index]);
    });
  }

  /**
   * Splits text by newlines and processes each segment. It uses a two-phase state
   * (`isLineStart`, `isContentStart`) to correctly handle optional line numbers
   * first, followed by indentation.
   */
  private handleTextNode(originalNode: Node, clonedNode: Node): void {
    const textContent = clonedNode.textContent || "";
    const segments = textContent.split(RegexPatterns.NEWLINE_REGEX);

    segments.forEach((segment, index) => {
      if (index > 0) {
        this.startNewLine();
      }

      let textToProcess = segment;

      // Phase 1: Handle line numbers only at the absolute start of a line.
      if (this.isLineStart && this.hasLineNumbers) {
        const match = textToProcess.match(RegexPatterns.LEADING_LINE_NUMBER_REGEX);
        if (match) {
          const lineNumberText = match[0];
          const lineNumberSpan = NodeUtils.createSpanWithTextContent(lineNumberText);
          MsOfficeUtils.preserveWhiteSpace(lineNumberSpan); // Preserve spaces like "  1. "
          this.getCurrentLine().push(lineNumberSpan);

          textToProcess = textToProcess.slice(lineNumberText.length);
        }
      }

      // Any processed content means we are no longer at the absolute line start.
      if (segment.length > 0) {
        this.isLineStart = false;
      }

      // Phase 2: Handle indentation and remaining text content.
      if (textToProcess.length > 0) {
        let chunk = textToProcess;
        if (this.isContentStart) {
          // Mask leading spaces/tabs to treat them as special indentation markers.
          chunk = IndentationFormatter.maskIndentation(textToProcess, this.tabSize);
          this.isContentStart = false;
        }
        this.createSpansFromChunk(chunk, originalNode.parentElement);
      }
    });
  }

  /**
   * Converts a text chunk into one or more `<span>` elements. If the chunk
   * contains leading indentation markers, it creates a dedicated span for the
   * indentation and another for the remaining text.
   */
  private createSpansFromChunk(chunk: string, parent: HTMLElement | null): void {
    const markerMatch = chunk.match(RegexPatterns.MARKER_ONLY_REGEX);

    if (markerMatch) {
      const matchedMarkers = markerMatch[0];
      const markerSpan = this.createIndentationSpan(matchedMarkers);
      this.getCurrentLine().push(markerSpan);

      if (matchedMarkers.length < chunk.length) {
        const text = chunk.slice(matchedMarkers.length);
        const textSpan = NodeUtils.createSpanWithTextContent(text);
        this.applyParentSpanStyles(parent, textSpan);
        this.getCurrentLine().push(textSpan);
      }
    } else {
      const textSpan = NodeUtils.createSpanWithTextContent(chunk);
      this.applyParentSpanStyles(parent, textSpan);
      this.getCurrentLine().push(textSpan);
    }
  }

  /**
   * Creates a `<span>` for indentation markers, applying mode-specific styles.
   * In "Tabs" mode, it uses tab characters and MS Office styles.
   * In "Spaces" mode, it uses non-breaking spaces.
   */
  private createIndentationSpan(markerText: string): HTMLElement {
    const markerCount = markerText.length;
    this.maxIndentationMarkers = Math.max(this.maxIndentationMarkers, markerCount);

    const markerSpan = NodeUtils.createSpan();

    if (this.indentationMode === IndentationMode.Tabs) {
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithTabs(markerText, this.tabSize);
      const tabCount = Math.floor(markerCount / this.tabSize);
      // Apply MS Office-specific style to render tab characters correctly.
      MsOfficeUtils.applyTabSpacing(markerSpan, tabCount);
    } else {
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithNbsp(markerText);
      // Apply MS Office-specific style to preserve consecutive spaces.
      MsOfficeUtils.preserveWhiteSpace(markerSpan);
    }

    return markerSpan;
  }

  /**
   * Applies a parent's inline styles to a child span, but only if the parent is also a `<span>`.
   * This preserves formatting within a line without inheriting block-level styles.
   */
  private applyParentSpanStyles(parent: HTMLElement | null, childSpan: HTMLElement): void {
    if (NodeUtils.isSpan(parent)) {
      InlineStyleApplier.applyElementStyles(parent, childSpan);
    }
  }

  /**
   * Resets the line state flags and adds a new empty line to the collection.
   */
  private startNewLine(): void {
    this.lines.push([]);
    this.isLineStart = true;
    this.isContentStart = true;
  }

  /**
   * Returns the array of nodes for the current line being processed.
   */
  private getCurrentLine(): Node[] {
    return this.lines[this.lines.length - 1];
  }
}
