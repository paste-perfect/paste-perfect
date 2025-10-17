import { SpecialCharacters } from "@constants";
import { NodeUtils } from "@utils/node-utils";

describe("NodeUtils", () => {
  describe("appendInlineStyle", () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement("div");
    });

    it("appends style to empty existing style", () => {
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("color: red;");
    });

    it("appends style with semicolon if missing from existing", () => {
      element.setAttribute(SpecialCharacters.STYLE_TAG, "font-size: 14px");
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("font-size: 14px;color: red;");
    });

    it("appends style directly if semicolon exists", () => {
      element.setAttribute(SpecialCharacters.STYLE_TAG, "font-size: 14px;");
      NodeUtils.appendInlineStyle(element, "color: red;");
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("font-size: 14px;color: red;");
    });
  });

  describe("removeAllAttributesExceptStyle", () => {
    it("removes all attributes except style", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");
      element.setAttribute("class", "box");
      element.setAttribute(SpecialCharacters.STYLE_TAG, "color: red;");
      NodeUtils.removeAllAttributesExceptStyle(element);
      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("color: red;");
    });

    it("works when there is no style attribute", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");
      NodeUtils.removeAllAttributesExceptStyle(element);
      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute(SpecialCharacters.STYLE_TAG)).toBe(false);
    });
  });

  describe("removeChildren", () => {
    it("removes all child nodes", () => {
      const parent = document.createElement("div");
      parent.appendChild(document.createElement("p"));
      parent.appendChild(document.createTextNode("Hello"));
      NodeUtils.removeChildren(parent);
      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe("createSpanWithTextContent", () => {
    it("creates a span with text content", () => {
      const span = NodeUtils.createSpanWithTextContent("Hello");
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("Hello");
    });
  });

  describe("createSpan", () => {
    it("creates an empty span", () => {
      const span = NodeUtils.createSpan();
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("");
    });
  });

  describe("createParagraph", () => {
    it("creates an empty paragraph", () => {
      const p = NodeUtils.createParagraph();
      expect(p).toBeInstanceOf(HTMLParagraphElement);
      expect(p.textContent).toBe("");
    });
  });

  describe("isHtmlElement", () => {
    it("returns true for HTMLElement", () => {
      const div = document.createElement("div");
      expect(NodeUtils.isHtmlElement(div)).toBe(true);
    });

    it("returns false for Text node", () => {
      const text = document.createTextNode("test");
      expect(NodeUtils.isHtmlElement(text)).toBe(false);
    });

    it("returns false for null", () => {
      expect(NodeUtils.isHtmlElement(null)).toBe(false);
    });
  });

  describe("isTextNode", () => {
    it("returns true for Text node", () => {
      const text = document.createTextNode("hello");
      expect(NodeUtils.isTextNode(text)).toBe(true);
    });

    it("returns false for HTMLElement", () => {
      const div = document.createElement("div");
      expect(NodeUtils.isTextNode(div)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(NodeUtils.isTextNode(undefined)).toBe(false);
    });
  });

  describe("isSpan", () => {
    it("returns true for span element", () => {
      const span = document.createElement("span");
      expect(NodeUtils.isSpan(span)).toBe(true);
    });

    it("returns false for div element", () => {
      const div = document.createElement("div");
      expect(NodeUtils.isSpan(div)).toBe(false);
    });

    it("returns false for null", () => {
      expect(NodeUtils.isSpan(null)).toBe(false);
    });
  });
});
