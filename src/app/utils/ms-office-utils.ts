import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "@constants";

/**
 * Utility class for applying inline styles required for proper formatting
 * when content is pasted into Microsoft Office applications (e.g., Word, Outlook).
 * These styles ensure spacing, margins, and tabbing behave as expected in Office environments.
 */
export class MsOfficeUtils {
  /**
   * Creates a `<span>` element containing a non-breaking space, with styles
   * that ensure it is preserved when rendered in Microsoft Office applications.
   * This is used to represent an intentionally empty line that Office
   * would otherwise strip out.
   *
   * @returns A styled `<span>` element representing an empty line.
   */
  public static createEmptyLineSpan(): HTMLSpanElement {
    const span: HTMLSpanElement = NodeUtils.createSpanWithTextContent(SpecialCharacters.NON_BREAKING_SPACE);
    this.preserveWhiteSpace(span); // This ensures Office apps don't strip it away
    return span;
  }

  /**
   * Removes all margins from the given HTML element by applying inline CSS.
   * @param element - The HTML element to modify.
   */
  public static applyNoMarginStyle(element: HTMLElement): void {
    NodeUtils.appendInlineStyle(element, "margin:0cm;");
  }

  /**
   * Ensures that white spaces are preserved in the element's style.
   * @param element - The HTML element to modify.
   */
  public static preserveWhiteSpace(element: HTMLElement): void {
    NodeUtils.appendInlineStyle(element, "mso-spacerun:yes");
  }

  /**
   * Applies a tab count to the given element using Microsoft Office-specific styling.
   * @param element - The HTML element to modify.
   * @param tabCount - The number of tabs to apply.
   */
  public static applyTabSpacing(element: HTMLElement, tabCount: number): void {
    NodeUtils.appendInlineStyle(element, `mso-tab-count:${tabCount}`);
  }
}
