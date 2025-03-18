import { SpecialCharacters } from "../constants";

/**
 * Utility class for processing DOM nodes.
 */
export class NodeUtils {
  /**
   * Recursively traverses a node's children and wraps text nodes inside `<span>` elements.
   * This ensures that all standalone text content is enclosed within a span for styling or manipulation.
   *
   * @param node - The parent node whose child nodes will be processed.
   */
  public static wrapAllTextNodesWithSpan(node: Node): void {
    node.childNodes.forEach((child: ChildNode): void => {
      // If the child is a non-empty text node and is not already inside a span
      if (this.isTextNode(child) && !this.isInsideSpan(child) && child.nodeValue?.trim() !== "") {
        // Create a new `<span>` element to wrap the text node
        const span: HTMLSpanElement = document.createElement(SpecialCharacters.SPAN_TAG);
        // Set the span's text content to match the original text node
        span.textContent = child.nodeValue;
        // Replace the text node with the new `<span>` element
        node.replaceChild(span, child);
      } else if (this.isHtmlElement(child)) {
        // If the child is an HTML element, recursively process its child nodes
        this.wrapAllTextNodesWithSpan(child);
      }
    });
  }

  /** Determines if the given node is an HTMLElement. */
  public static isHtmlElement(node?: Node | null): node is HTMLElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
  }

  /** Determines if the given node is a Text node. */
  public static isTextNode(node?: Node | null): node is Text {
    return !!node && node.nodeType === Node.TEXT_NODE;
  }

  /** Checks if the given node is inside a `<span>`. */
  public static isInsideSpan(node: Node): boolean {
    let parent: ParentNode | null = node.parentNode;
    while (parent) {
      if (parent.nodeName.toLowerCase() === SpecialCharacters.SPAN_TAG) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }
}
