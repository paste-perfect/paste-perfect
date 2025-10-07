import { SpecialCharacters } from "@constants";

export class NodeUtils {
  /**
   * Appends a new inline style to an existing element's style attribute.
   *
   * @param element The HTML element to modify.
   * @param style A CSS string to append.
   */
  public static appendInlineStyle(element: HTMLElement, style: string) {
    const existingStyle = element.getAttribute(SpecialCharacters.STYLE_TAG) || "";
    const combinedStyle = `${existingStyle.trim()}${existingStyle.trim().endsWith(";") || !existingStyle.trim() ? "" : ";"}${style}`;
    element.setAttribute(SpecialCharacters.STYLE_TAG, combinedStyle);
  }

  /**
   * Removes all attributes from an element except for 'style'.
   *
   * @param element The HTML element to clean.
   */
  public static removeAllAttributesExceptStyle(element: HTMLElement): void {
    // Loop backwards to avoid index shifting
    for (let i = element.attributes.length - 1; i >= 0; i--) {
      const attrName = element.attributes[i].name;
      if (attrName !== SpecialCharacters.STYLE_TAG) {
        element.removeAttribute(attrName);
      }
    }
  }
  /**
   * Removes all child nodes from the given parent node.
   *
   * @param parent The node to clear.
   */
  public static removeChildren(parent: Node): void {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }

  /**
   * Creates a <span> element with the given text content.
   *
   * @param textContent The text to insert.
   * @returns A <span> element containing the text.
   */
  public static createSpanWithTextContent(textContent: string): HTMLSpanElement {
    const span = this.createSpan();
    span.textContent = textContent;
    return span;
  }

  /**
   * Creates an empty <span> element.
   *
   * @returns A new <span> element.
   */
  public static createSpan(): HTMLSpanElement {
    return document.createElement(SpecialCharacters.SPAN_TAG);
  }

  /**
   * Creates an empty <p> element.
   *
   * @returns A new <p> element.
   */
  public static createParagraph(): HTMLParagraphElement {
    return document.createElement(SpecialCharacters.PARAGRAPH_TAG);
  }

  /**
   * Checks if a node is an HTMLElement.
   *
   * @param node The node to check.
   * @returns True if the node is an HTMLElement.
   */
  public static isHtmlElement(node?: Node | null): node is HTMLElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE;
  }

  /**
   * Checks if a node is a Text node.
   *
   * @param node The node to check.
   * @returns True if the node is a Text node.
   */
  public static isTextNode(node?: Node | null): node is Text {
    return !!node && node.nodeType === Node.TEXT_NODE;
  }

  /**
   * Checks if a node is a <span> element.
   *
   * @param node The node to check.
   * @returns True if the node is a <span> element.
   */
  public static isSpan(node?: Node | null): node is HTMLSpanElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE && node.nodeName.toLowerCase() === SpecialCharacters.SPAN_TAG;
  }
}
