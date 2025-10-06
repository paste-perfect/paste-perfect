import { NodeUtils } from "@utils/node-utils";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { IndentationMode } from "@constants";
import { IndentationFormatter } from "@utils/indentation-formatter";
import { RegexPatterns } from "../regex/regex-patterns";
import { MsOfficeUtils } from "@utils/ms-office-utils";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";

/**
 * A utility class that:
 *  1. Recursively processes an original node and its cloned counterpart,
 *  2. Collects text and element nodes line-by-line (using detected newlines),
 *  3. Appends them as paragraph elements (`<p>`) to a target parent node.
 *
 * This preserves the structure of lines, applying indentation (spaces/tabs)
 * while removing unnecessary attributes from cloned nodes.
 */
export class LinesCollector {
  private readonly lines: Node[][]; // Stores arrays of Node objects, each representing a single line
  private readonly tabSize: number; // Number of spaces to use in place of a single tab
  private readonly indentationMode: IndentationMode; // Whether we want to use spaces or tabs for indentation
  private readonly hasLineNumbers: boolean;
  private isLineStart: boolean; // Tracks if we are at the absolute start of a new line.
  private isContentStart: boolean; // Tracks if we are at the start of the content, after any line number.
  private maxIndentationMarkers = 0; // Tracks the maximum number of consecutive markers in any line
  private readonly lineNumberWidth: number = 0;

  /**
   * @param indentationMode Desired indentation mode (Tabs vs Spaces).
   * @param tabSize Number of spaces used when replacing tab characters or converting marker runs.
   * @param hasLineNumbers
   */
  constructor(indentationMode: IndentationMode, tabSize: number, hasLineNumbers: boolean) {
    this.lines = [[]];
    this.isLineStart = true;
    this.isContentStart = true;
    this.hasLineNumbers = hasLineNumbers;
    this.tabSize = tabSize;
    this.indentationMode = indentationMode;
    this.lineNumberWidth = MsOfficeUtils.pxToOfficePt(LineNumberingService.getLineNumberWidth());
  }

  /**
   * Recursively processes `original` and `cloned` nodes in parallel, collecting content
   * into a line buffer. Rebuilds the cloned node by appending paragraphs for each line.
   *
   * @param original The original Node.
   * @param cloned   The cloned Node (will have children removed and replaced by line-based paragraphs).
   */
  public collectLinesFromNodes(original: Node, cloned: Node): void {
    if (NodeUtils.isHtmlElement(cloned)) {
      NodeUtils.removeAllAttributesExceptStyle(cloned);
    }

    // Capture root styles from the original, to apply those to newly created spans/paragraphs later
    InlineStyleApplier.captureRootStyles(original as HTMLElement);

    const originalChildren = Array.from(original.childNodes);
    const clonedChildren = Array.from(cloned.childNodes);

    originalChildren.forEach((child, index) => {
      this.processNode(child, clonedChildren[index]);
    });

    // Clear any existing content in the cloned node
    NodeUtils.removeChildren(cloned);

    // Rebuild the cloned node by appending lines as <p> elements
    this.appendCollectedLinesAsParagraphs(cloned);
  }

  /**
   * Appends each collected line as a `<p>` element to the provided parent node.
   * If using tabs, also inserts custom styles for tab stops based on the maximum marker count.
   *
   * @param parent The parent node to receive the appended `<p>` elements.
   */
  public appendCollectedLinesAsParagraphs(parent: Node): void {
    for (const lineNodes of this.lines) {
      const p: HTMLParagraphElement = NodeUtils.createParagraph();
      InlineStyleApplier.applyStoredRootStyles(p);
      // Remove line spacing (margins)
      MsOfficeUtils.applyNoMarginStyle(p);

      // If there's nothing in this line, we still append an empty paragraph
      if (lineNodes.length === 0) {
        p.appendChild(MsOfficeUtils.createEmptyLineSpan());
        parent.appendChild(p);
        continue;
      }

      if (this.hasLineNumbers && NodeUtils.isHtmlElement(lineNodes[0])) {
        // TODO: somehow determine the width of this element and then convert it into "pt" and pass it into the getTabStops
      }

      // Append each collected node
      lineNodes.forEach((node) => p.appendChild(node));

      // When using tabs, set up tab stops according to the maximum marker count
      if (this.indentationMode === IndentationMode.Tabs) {
        const requiredStops = Math.ceil(this.maxIndentationMarkers / this.tabSize);
        // TODO: Determine an offset based on the line numbers in pt and pass it into the getTabStops to properly accompy for starting line numbers (if any)
        const newStyle = NodeUtils.getTabStops(requiredStops, this.lineNumberWidth);
        NodeUtils.appendInlineStyle(p, newStyle);
      }

      parent.appendChild(p);
    }
  }

  /**
   * Inspects the node's type and routes it to the appropriate handler.
   *
   * @param originalNode The node in the original DOM.
   * @param clonedNode   The corresponding node in the cloned DOM.
   */
  private processNode(originalNode: Node, clonedNode: Node): void {
    if (NodeUtils.isHtmlElement(originalNode) && NodeUtils.isHtmlElement(clonedNode)) {
      this.handleElement(originalNode as HTMLElement, clonedNode as HTMLElement);
      return;
    }

    if (NodeUtils.isTextNode(clonedNode)) {
      this.handleTextNode(originalNode, clonedNode);
      return;
    }

    // Other node types (comments, etc.) are currently ignored/unchanged
  }

  /**
   * Copies inline styles to the cloned element, then iterates through child nodes
   * and processes them. Spans are inlined directly onto the current line;
   * other elements are traversed recursively.
   *
   * @param originalNode The original HTML element.
   * @param clonedNode   The cloned HTML element.
   */
  private handleElement(originalNode: HTMLElement, clonedNode: HTMLElement): void {
    // Copy inline styles from original to cloned
    InlineStyleApplier.applyElementStyles(originalNode, clonedNode);
    // Remove all attributes except style
    NodeUtils.removeAllAttributesExceptStyle(clonedNode);

    const origChildren = Array.from(originalNode.childNodes);
    const clonedChildren = Array.from(clonedNode.childNodes);

    // Always recurse through each child, letting handleTextNode() split newlines
    origChildren.forEach((child, index) => {
      this.processNode(child, clonedChildren[index]);
    });
  }

  /**
   * Splits text by newlines and processes each segment. It uses a two-stage state (`isLineStart`, `isContentStart`)
   * to correctly handle optional line numbers first, followed by indentation, even if they occur in separate text nodes.
   *
   * @param originalNode The original node, used to access parent styles.
   * @param clonedNode The text node in the cloned DOM.
   */
  private handleTextNode(originalNode: Node, clonedNode: Node): void {
    const textContent = clonedNode.textContent || "";
    const segments = textContent.split(RegexPatterns.NEWLINE_REGEX);

    segments.forEach((segment, index) => {
      if (index > 0) {
        this.startNewLine();
      }

      let textToProcess = segment;

      // Phase 1: Handle line numbers only at the absolute start of the line.
      if (this.isLineStart && this.hasLineNumbers) {
        const match = textToProcess.match(RegexPatterns.LEADING_LINE_NUMBER_REGEX);
        if (match) {
          const lineNumberText = match[0];
          const lineNumberSpan = NodeUtils.createSpanWithTextContent(lineNumberText);
          // Preserve leading spaces in the line number (e.g., "  1. ") as requested.
          MsOfficeUtils.preserveWhiteSpace(lineNumberSpan);
          this.getCurrentLine().push(lineNumberSpan);

          // The remainder of the string is what needs indentation processing.
          textToProcess = textToProcess.slice(lineNumberText.length);
        }
      }

      // If we processed any part of the segment, we are no longer at the absolute line start.
      if (segment.length > 0) {
        this.isLineStart = false;
      }

      // Phase 2: Handle indentation at the start of the line's main content.
      if (this.isContentStart && textToProcess.length > 0) {
        const chunk = IndentationFormatter.maskIndentation(textToProcess, this.tabSize);
        this.createSpanFromChunk(chunk, originalNode.parentElement);
        // Once we've processed any content, we're no longer at the content start.
        this.isContentStart = false;
      } else if (textToProcess.length > 0) {
        // Not at the content start, so process as a normal middle-of-the-line chunk.
        this.createSpanFromChunk(textToProcess, originalNode.parentElement);
      }
    });
  }

  /**
   * Creates one or more `<span>` elements from a text chunk. If the chunk starts
   * with indentation markers, it creates a span for that portion and (optionally) a
   * second span for the remainder. Otherwise, it creates a single text span.
   *
   * @param chunk The piece of text to convert into span(s).
   * @param parent
   */
  private createSpanFromChunk(chunk: string, parent: HTMLElement | null): void {
    // Match a run of indentation markers at the start of the chunk
    const markerMatch = chunk.match(RegexPatterns.MARKER_ONLY_REGEX);

    if (markerMatch) {
      const matchedMarkers = markerMatch[0];
      const markerLength = matchedMarkers.length;

      if (markerLength === chunk.length) {
        // The entire chunk is just markers
        this.getCurrentLine().push(this.createMarkerSpan(chunk));
      } else {
        // Part markers, part normal text
        const markerSpan = this.createMarkerSpan(matchedMarkers);
        const textSpan = NodeUtils.createSpanWithTextContent(chunk.slice(markerLength));
        this.applyParentSpanStyles(parent, textSpan);
        this.getCurrentLine().push(markerSpan, textSpan);
      }
    } else {
      // No leading markers => just normal text
      const textSpan = NodeUtils.createSpanWithTextContent(chunk);
      this.applyParentSpanStyles(parent, textSpan);
      this.getCurrentLine().push(textSpan);
    }
  }

  /**
   * Creates a `<span>` dedicated to indentation markers, applying styles based on the
   * configured `mode` (tabs vs. spaces). Updates `maxMarkers` as needed.
   *
   * @param markerText The string of marker characters to convert.
   * @returns A span containing the transformed text (or empty if tab-based).
   */
  private createMarkerSpan(markerText: string): HTMLElement {
    const markerSpan = NodeUtils.createSpanWithTextContent(markerText);
    const markerCount = markerText.length;

    // Update the max marker count for final tab stops
    this.maxIndentationMarkers = Math.max(this.maxIndentationMarkers, markerCount);

    if (this.indentationMode === IndentationMode.Tabs) {
      // Replace the markers with tabs (not needed for Office-Applications, but might be for others)
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithTabs(markerText, this.tabSize);
      const tabCount = Math.floor(markerCount / this.tabSize);
      // MS Office syntax required to properly indent the line with a number of tabs
      MsOfficeUtils.applyTabSpacing(markerSpan, tabCount);
    } else {
      // Convert marker characters to actual spaces
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithNbsp(markerText);
      // MS Office syntax required to keep multiple leading spaces
      MsOfficeUtils.preserveWhiteSpace(markerSpan);
    }

    return markerSpan;
  }

  /**
   * Applies the parent's inline styles to the child span ONLY if the parent is a <span>.
   */
  private applyParentSpanStyles(parent: HTMLElement | null, childSpan: HTMLElement): void {
    if (NodeUtils.isSpan(parent)) {
      InlineStyleApplier.applyElementStyles(parent, childSpan);
    }
  }

  /**
   * Signals the start of a new line by pushing a fresh array onto `allLines`
   * and resetting the line state flags.
   */
  private startNewLine(): void {
    this.lines.push([]);
    this.isLineStart = true;
    this.isContentStart = true;
  }

  /**
   * @returns The array of nodes that make up the current (most recent) line.
   */
  private getCurrentLine(): Node[] {
    return this.lines[this.lines.length - 1];
  }
}
