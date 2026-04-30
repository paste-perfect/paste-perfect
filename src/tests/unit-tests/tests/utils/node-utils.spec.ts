import { beforeEach, describe, expect, it } from "vitest";
import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "@constants/special-characters";
import { useStandardTeardown } from "../../test-utils/utils";

describe("NodeUtils", () => {
  useStandardTeardown();

  describe("appendInlineStyle", () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement("div");
    });

    it.each([
      ["element with no existing style", undefined, "color: red;", "color: red;"],
      ["existing style is missing a trailing semicolon", "font-size: 14px", "color: red;", "font-size: 14px;color: red;"],
      ["existing style already ends with a semicolon", "font-size: 14px;", "color: red;", "font-size: 14px;color: red;"],
    ] as const)("appends correctly when %s", (_label, existing, toAppend, expected) => {
      if (existing !== undefined) element.setAttribute(SpecialCharacters.STYLE_TAG, existing);
      NodeUtils.appendInlineStyle(element, toAppend);
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe(expected);
    });
  });

  describe("removeAllAttributesExceptStyle", () => {
    it("removes all attributes except the style attribute", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");
      element.setAttribute("class", "box");
      element.setAttribute(SpecialCharacters.STYLE_TAG, "color: red;");

      NodeUtils.removeAllAttributesExceptStyle(element);

      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute("class")).toBe(false);
      expect(element.getAttribute(SpecialCharacters.STYLE_TAG)).toBe("color: red;");
    });

    it("works correctly when no style attribute exists", () => {
      const element = document.createElement("div");
      element.setAttribute("id", "test");

      NodeUtils.removeAllAttributesExceptStyle(element);

      expect(element.hasAttribute("id")).toBe(false);
      expect(element.hasAttribute(SpecialCharacters.STYLE_TAG)).toBe(false);
    });
  });

  describe("removeChildren", () => {
    it("removes all child nodes from a parent element", () => {
      const parent = document.createElement("div");
      parent.appendChild(document.createElement("p"));
      parent.appendChild(document.createTextNode("Hello"));

      NodeUtils.removeChildren(parent);

      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe("createSpanWithTextContent", () => {
    it("creates an HTMLSpanElement with the provided text content", () => {
      const span = NodeUtils.createSpanWithTextContent("Hello");
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("Hello");
    });
  });

  describe("createSpan", () => {
    it("creates an empty HTMLSpanElement", () => {
      const span = NodeUtils.createSpan();
      expect(span).toBeInstanceOf(HTMLSpanElement);
      expect(span.textContent).toBe("");
    });
  });

  describe("createParagraph", () => {
    it("creates an empty HTMLParagraphElement", () => {
      const p = NodeUtils.createParagraph();
      expect(p).toBeInstanceOf(HTMLParagraphElement);
      expect(p.textContent).toBe("");
    });
  });

  describe("isHtmlElement", () => {
    it.each([
      { label: "an HTMLElement", expected: true, factory: () => document.createElement("div") },
      { label: "a Text node", expected: false, factory: () => document.createTextNode("test") },
      { label: "null", expected: false, factory: () => null },
    ])("returns $expected for $label", ({ factory, expected }) => {
      expect(NodeUtils.isHtmlElement(factory())).toBe(expected);
    });
  });

  describe("isTextNode", () => {
    it.each([
      { label: "a Text node", expected: true, factory: () => document.createTextNode("hello") },
      { label: "an HTMLElement", expected: false, factory: () => document.createElement("div") },
      { label: "undefined", expected: false, factory: () => undefined },
    ])("returns $expected for $label", ({ factory, expected }) => {
      expect(NodeUtils.isTextNode(factory())).toBe(expected);
    });
  });

  describe("isSpan", () => {
    it.each([
      { label: "a span element", expected: true, factory: () => document.createElement("span") },
      { label: "a non-span element", expected: false, factory: () => document.createElement("div") },
      { label: "null", expected: false, factory: () => null },
    ])("returns $expected for $label", ({ factory, expected }) => {
      expect(NodeUtils.isSpan(factory())).toBe(expected);
    });
  });
});
