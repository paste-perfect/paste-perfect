import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "@constants";

/**
 * Utility class for applying inline styles required for proper formatting
 * when content is pasted into Microsoft Office applications (e.g., Word, Outlook).
 * These styles ensure spacing, margins, and tabbing behave as expected in Office environments.
 */
export class MsOfficeUtils {
  private static CM_IN_PT = 28.3465;

  /**
   * Converts pixels (px) to points (pt).
   * Assumes a standard 96 DPI screen, where 1 inch = 96px and 1 inch = 72pt.
   * @param px The value in pixels.
   * @returns The equivalent value in points.
   */
  public static pxToOfficePt(px: number): number {
    return px * (96 / 72);
  }

  /**
   * Converts centimeters (cm) to points (pt).
   * @param cm The value in centimeters.
   * @returns The equivalent value in points.
   */
  public static cmToOfficePt(cm: number): number {
    return cm * MsOfficeUtils.CM_IN_PT;
  }

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

  /**
   * Generates a CSS string with tab stop positions for tab-indented content.
   *
   * @param count Number of tab stops to create.
   * @param offsetInPt Offset in points that gets added to each tab stop position. Defaults to 0.
   * @returns A CSS string defining left tab stops.
   */
  public static getTabStops(count: number, offsetInPt = 0): string {
    if (count === 0) {
      return "";
    }

    const stops = Array.from({ length: count }, (_, i) => {
      const position = (MsOfficeUtils.cmToOfficePt(i + 1) + offsetInPt).toFixed(4);
      return `left ${position}pt`;
    }).join(" ");

    return `tab-stops: ${stops};`;
  }
}
