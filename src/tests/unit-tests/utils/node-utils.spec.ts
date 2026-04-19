import { beforeEach, describe, expect, it } from "vitest";
import { SpecialCharacters } from "@constants";
import { NodeUtils } from "@utils/node-utils";

// ---------------------------------------------------------------------------
// NOTE: NodeUtils operates exclusively on native DOM APIs — no Angular
// TestBed, no zone, and no async coordination required.
// ---------------------------------------------------------------------------

describe("NodeUtils", () => {
  // ─── appendInlineStyle ────────────────────────────────────────────────────
  describe("appendInlineStyle", () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement("div");
    });

    it("should append a style string to an element with no existing style", () => {
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("color: red;");
    });

    it("should append a semicolon before the new style when the existing style is missing one", () => {
      element.setAttribute(SpecialCharacters.STYLE_TAG, "font-size: 14px");
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("font-size: 14px;color: red;");
    });

    it("should append the new style directly when the existing style already ends with a semicolon", () => {
      element.setAttribute(SpecialCharacters.STYLE_TAG, "font-size: 14px;");
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("font-size: 14px;color: red;");
    });
  });

  // ─── removeAllAttributesExceptStyle ───────────────────────────────────────
  describe("removeAllAttributesExceptStyle", () => {
    it("should remove all attributes except the style attribute", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");
      element.setAttribute("class", "box");
      element.setAttribute(SpecialCharacters.STYLE_TAG, "color: red;");

      NodeUtils.removeAllAttributesExceptStyle(element);

      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("color: red;");
    });

    it("should work correctly when no style attribute exists", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");

      NodeUtils.removeAllAttributesExceptStyle(element);

      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute(SpecialCharacters.STYLE_TAG)).toBe(false);
    });
  });

  // ─── removeChildren ───────────────────────────────────────────────────────
  describe("removeChildren", () => {
    it("should remove all child nodes from a parent element", () => {
      const parent = document.createElement("div");
      parent.appendChild(document.createElement("p"));
      parent.appendChild(document.createTextNode("Hello"));

      NodeUtils.removeChildren(parent);

      expect(parent.childNodes.length).toBe(0);
    });
  });

  // ─── factory helpers ──────────────────────────────────────────────────────
  describe("createSpanWithTextContent", () => {
    it("should create an HTMLSpanElement with the provided text content", () => {
      const span = NodeUtils.createSpanWithTextContent("Hello");
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("Hello");
    });
  });

  describe("createSpan", () => {
    it("should create an empty HTMLSpanElement", () => {
      const span = NodeUtils.createSpan();
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("");
    });
  });

  describe("createParagraph", () => {
    it("should create an empty HTMLParagraphElement", () => {
      const p = NodeUtils.createParagraph();
      expect(p).toBeInstanceOf(HTMLParagraphElement);
      expect(p.textContent).toBe("");
    });
  });

  // ─── type-guard helpers ───────────────────────────────────────────────────
  describe("isHtmlElement", () => {
    it("should return true for an HTMLElement", () => {
      expect(NodeUtils.isHtmlElement(document.createElement("div"))).toBe(true);
    });

    it("should return false for a Text node", () => {
      expect(NodeUtils.isHtmlElement(document.createTextNode("test"))).toBe(false);
    });

    it("should return false for null", () => {
      expect(NodeUtils.isHtmlElement(null)).toBe(false);
    });
  });

  describe("isTextNode", () => {
    it("should return true for a Text node", () => {
      expect(NodeUtils.isTextNode(document.createTextNode("hello"))).toBe(true);
    });

    it("should return false for an HTMLElement", () => {
      expect(NodeUtils.isTextNode(document.createElement("div"))).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(NodeUtils.isTextNode(undefined)).toBe(false);
    });
  });

  describe("isSpan", () => {
    it("should return true for a span element", () => {
      expect(NodeUtils.isSpan(document.createElement("span"))).toBe(true);
    });

    it("should return false for a non-span element", () => {
      expect(NodeUtils.isSpan(document.createElement("div"))).toBe(false);
    });

    it("should return false for null", () => {
      expect(NodeUtils.isSpan(null)).toBe(false);
    });
  });
});
