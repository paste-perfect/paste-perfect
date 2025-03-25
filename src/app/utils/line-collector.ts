import { NodeUtils } from "@utils/node-utils";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { INDENTATION_MODE_MAP } from "../constants";
import { IndentationModeValue } from "@types";
import { IndentationFormatter } from "@utils/indentation-formatter";
import { RegexPatterns } from "../regex/regex-patterns";
import { OfficeUtils } from "@utils/office-utils";

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
  private readonly indentationMode: IndentationModeValue; // Whether we want to use spaces or tabs for indentation
  private isStartOfLine: boolean; // Tracks if we are at the start of a line
  private maxIndentationMarkers = 0; // Tracks the maximum number of consecutive markers in any line

  /**
   * @param indentationMode Desired indentation mode (Tabs vs Spaces).
   * @param tabSize Number of spaces used when replacing tab characters or converting marker runs.
   */
  constructor(indentationMode: IndentationModeValue, tabSize: number) {
    this.lines = [[]];
    this.isStartOfLine = true;
    this.tabSize = tabSize;
    this.indentationMode = indentationMode;
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
      OfficeUtils.applyNoMarginStyle(p);

      // If there's nothing in this line, we still append an empty paragraph
      if (lineNodes.length === 0) {
        p.appendChild(OfficeUtils.createEmptyLineSpan());
        parent.appendChild(p);
        continue;
      }

      // Append each collected node
      lineNodes.forEach((node) => p.appendChild(node));

      // When using tabs, set up tab stops according to the maximum marker count
      if (this.indentationMode === INDENTATION_MODE_MAP.Tabs) {
        const requiredStops = Math.ceil(this.maxIndentationMarkers / this.tabSize);
        const newStyle = NodeUtils.getTabStops(requiredStops);
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
   * Splits text content by newline, starting a new line each time a newline is encountered.
   * Leading indentation markers are handled at the beginning of each line.
   *
   * @param originalNode
   * @param clonedNode The text node in the cloned DOM.
   */
  private handleTextNode(originalNode: Node, clonedNode: Node): void {
    const textContent = clonedNode.textContent || "";
    const segments = textContent.split(RegexPatterns.NEWLINE_REGEX);

    segments.forEach((segment, index) => {
      if (index > 0) {
        // Encountered a newline => finalize the previous line, start a new line
        this.startNewLine();
      }

      if (segment.length > 0) {
        let chunk = segment;
        if (this.isStartOfLine) {
          // Mask out indentation markers only at the very start of a line
          chunk = IndentationFormatter.maskIndentation(chunk, this.tabSize);
        }

        this.createSpanFromChunk(chunk, originalNode.parentElement);
        this.isStartOfLine = false;
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

    if (this.indentationMode === INDENTATION_MODE_MAP.Tabs) {
      // Replace the markers with tabs (not needed for Office-Applications, but might be for others)
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithTabs(markerText, this.tabSize);
      const tabCount = Math.floor(markerCount / this.tabSize);
      // MS Office syntax required to properly indent the line with a number of tabs
      OfficeUtils.applyTabSpacing(markerSpan, tabCount);
    } else {
      // Convert marker characters to actual spaces
      markerSpan.textContent = IndentationFormatter.unmaskIndentationWithNbsp(markerText);
      // MS Office syntax required to keep multiple leading spaces
      OfficeUtils.preserveWhiteSpace(markerSpan);
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
   * Signals the start of a new line by pushing a fresh array onto `allLines`.
   * Also resets `isStartOfLine` to `true`.
   */
  private startNewLine(): void {
    this.lines.push([]);
    this.isStartOfLine = true;
  }

  /**
   * @returns The array of nodes that make up the current (most recent) line.
   */
  private getCurrentLine(): Node[] {
    return this.lines[this.lines.length - 1];
  }
}
