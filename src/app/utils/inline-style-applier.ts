import { StyleProperties } from "@types";
import { getEntries } from "@utils/utils";

/**
 * Applies essential inline styles to HTML elements for clipboard copying.
 *
 * Since stylesheets aren't preserved in clipboard content, only key font-related
 * styles are manually inlined (e.g., font-family, color). Layout and background styles
 * are excluded to keep the copied HTML lightweight and readable.
 */
export class InlineStyleApplier {
  /**
   * Stores computed style properties from the root node for child elements.
   *
   * This is necessary for elements that were previously text nodes and have now been converted into HTML elements.
   * Since these elements did not exist as styled nodes in the original structure, they require explicit styling from
   * the root node to maintain consistency. The stored properties help reapply the correct styles where needed.
   */
  private static rootStyleProperties: StyleProperties = {};

  /**
   * Defines the subset of styles that are copied inline when creating the final snippet.
   * We can also provide default values for which inline styles do not get applied for (i.e., the default font style is "normal" and we don't have to repeat that for every single element)
   *
   * Mostly font-related properties are retained, while background colors, margins, paddings,
   * and other layout styles are excluded. This keeps the copied content lightweight while
   * ensuring textual appearance remains accurate.
   */
  private static readonly RELEVANT_STYLE_PROPERTIES: StyleProperties = {
    color: "rgba(0, 0, 0)", // or undefined if no default should be used
    "font-family": undefined, // use no default font family
    "font-size": undefined, // use not default font size
    "font-style": "normal",
    "font-variant": "normal",
    "font-weight": "400",
  };

  /**
   * Extracts and stores root-level styles to apply to converted text elements.
   */
  public static captureRootStyles(element: HTMLElement): void {
    // Retrieve computed style for the original element
    const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);

    // Apply only relevant styles
    getEntries(this.RELEVANT_STYLE_PROPERTIES).forEach(([propKey, defaultValue]) => {
      const value: string = computedStyle.getPropertyValue(propKey);

      if (value !== defaultValue) {
        // Store root-level styles for later use in child elements
        this.rootStyleProperties[propKey] = value;
      }
    });
  }

  /**
   * Extracts and applies computed styles from the original element to the cloned element.
   *
   * @param original - The original HTML element from which styles are extracted.
   * @param cloned - The cloned HTML element to which styles will be applied.
   */
  public static applyElementStyles(original: HTMLElement, cloned: HTMLElement): void {
    // Retrieve computed style for the original element
    const computedStyle: CSSStyleDeclaration = window.getComputedStyle(original);

    // Apply only relevant styles
    getEntries(this.RELEVANT_STYLE_PROPERTIES).forEach(([propKey, defaultValue]) => {
      const value: string = computedStyle.getPropertyValue(propKey);

      // Apply style only if it's different from the default
      if (value && value !== defaultValue) {
        cloned.style.setProperty(propKey, value);
      }
    });
  }

  /**
   * Applies the stored root-level styles to a non-root element.
   *
   * This is necessary for elements that were originally text nodes but have been converted into span elements.
   * Since such elements do not inherit styles in the usual way, we explicitly reapply the stored styles to maintain
   * text consistency.
   *
   * @param element - The HTML element to which stored root styles will be applied.
   */
  public static applyStoredRootStyles(element: HTMLElement): void {
    // Apply stored root properties to non-root elements that require explicit styling
    getEntries(this.rootStyleProperties).forEach(([propKey, propValue]) => {
      if (propValue && propValue !== this.RELEVANT_STYLE_PROPERTIES[propKey]) {
        element.style.setProperty(propKey, propValue);
      }
    });
  }
}
