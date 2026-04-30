import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinesCollector } from "@utils/line-collector";
import {
  createOriginalClonedPair,
  createStyledSpan,
  createTextNode,
  mockLineNumberGutter,
  useStandardTeardown,
} from "../../test-utils/utils";
import { IndentationMode } from "@constants/const";
import { SpecialCharacters } from "@constants/special-characters";

const makeCollector = (mode: IndentationMode, tabSize = 2, hasLineNumbers = false) => new LinesCollector(mode, tabSize, hasLineNumbers);

const attachToDom = (original: HTMLElement, cloned: HTMLElement, node: Node) => {
  original.appendChild(node);
  cloned.appendChild(node.cloneNode(true));
};

describe("LinesCollector", () => {
  let original: HTMLElement;
  let cloned: HTMLElement;

  beforeEach(() => {
    ({ original, cloned } = createOriginalClonedPair());
  });

  useStandardTeardown({ clearBody: true });

  describe("when hasLineNumbers is false", () => {
    describe("Spaces indentation mode", () => {
      it("splits multi-line text into separate <p> elements", () => {
        const collector = makeCollector(IndentationMode.Spaces);
        attachToDom(original, cloned, createStyledSpan("  indented line\nsecond line"));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

        expect(paragraphs.length).toBeGreaterThanOrEqual(2);
        expect(paragraphs.every((p) => p.tagName === "P")).toBe(true);
        expect(paragraphs[0].textContent).toContain("indented line");
        expect(paragraphs[1].textContent).toContain("second line");
      });

      it("replaces leading spaces with non-breaking spaces and applies MS Office spacerun style", () => {
        const collector = makeCollector(IndentationMode.Spaces);
        attachToDom(original, cloned, createStyledSpan("  indented line"));

        collector.collectLinesFromNodes(original, cloned);
        const p = cloned.querySelector("p");
        const indentationSpan = p?.querySelector("span");

        expect(p?.textContent).toMatch(new RegExp(SpecialCharacters.NON_BREAKING_SPACE));
        expect(indentationSpan?.getAttribute("style")).toContain("mso-spacerun:yes");
      });

      it("produces NBSP-only paragraphs for empty lines with MS Office spacerun style", () => {
        const collector = makeCollector(IndentationMode.Spaces);
        attachToDom(original, cloned, createStyledSpan("\n"));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.querySelectorAll("p"));

        expect(paragraphs).toHaveLength(2);
        paragraphs.forEach((p) => {
          expect(p.textContent).toBe(SpecialCharacters.NON_BREAKING_SPACE);
          expect(p.querySelector("span")?.getAttribute("style")).toContain("mso-spacerun:yes");
        });
      });
    });

    describe("Tabs indentation mode", () => {
      it("splits multi-line text, stamps tab-stop styles on paragraphs, and tab-counts on spans", () => {
        const collector = makeCollector(IndentationMode.Tabs, 2);
        attachToDom(original, cloned, createStyledSpan("  Tabbed text\nNext"));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.querySelectorAll("p"));

        expect(paragraphs).toHaveLength(2);
        paragraphs.forEach((p) => {
          expect(p.style.getPropertyValue("tab-stops") || p.getAttribute("style")).toMatch(/left/);
        });

        const indentedSpan = paragraphs[0].querySelector("span");
        expect(indentedSpan?.getAttribute("style")).toContain("mso-tab-count:1");
      });
    });

    describe("Unsupported node types", () => {
      it("ignores comment nodes and keeps exactly one element node in output", () => {
        const collector = makeCollector(IndentationMode.Spaces);
        const comment = document.createComment("some comment");
        const span = createStyledSpan("content");

        original.appendChild(comment);
        original.appendChild(span);
        cloned.appendChild(comment.cloneNode());
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);

        const hasComments = Array.from(cloned.childNodes).some((n) => n.nodeType === Node.COMMENT_NODE);
        expect(hasComments).toBe(false);
      });
    });
  });

  describe("when hasLineNumbers is true", () => {
    beforeEach(() => {
      mockLineNumberGutter(50);
    });

    it("parses line-number prefixes and splits them into separate child spans with spacerun", () => {
      const collector = makeCollector(IndentationMode.Spaces, 2, true);
      attachToDom(original, cloned, createStyledSpan("1. First line\n2. Second line"));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.querySelectorAll("p"));

      expect(paragraphs).toHaveLength(2);

      const firstLineNumberSpan = paragraphs[0].querySelector("span");
      const secondLineNumberSpan = paragraphs[1].querySelector("span");

      expect(firstLineNumberSpan?.textContent).toBe("1. ");
      expect(firstLineNumberSpan?.getAttribute("style")).toContain("mso-spacerun:yes");
      expect(secondLineNumberSpan?.textContent).toBe("2. ");
      expect(secondLineNumberSpan?.getAttribute("style")).toContain("mso-spacerun:yes");
    });

    it("emits three child spans — number, indentation, text — for indented lines after a number", () => {
      const collector = makeCollector(IndentationMode.Spaces, 2, true);
      attachToDom(original, cloned, createStyledSpan("1.   Indented line"));

      collector.collectLinesFromNodes(original, cloned);
      const spans = cloned.querySelector("p")?.querySelectorAll("span");

      expect(spans?.length).toBe(3);
      expect(spans?.[0].textContent).toBe("1. ");
      expect(spans?.[0].getAttribute("style")).toContain("mso-spacerun:yes");
      expect(spans?.[1].textContent).toContain(SpecialCharacters.NON_BREAKING_SPACE);
      expect(spans?.[1].getAttribute("style")).toContain("mso-spacerun:yes");
    });
  });

  describe("Style and Node handling", () => {
    it("copies all CSS properties from a parent <span> to the child span", () => {
      const collector = makeCollector(IndentationMode.Spaces, 4);
      const parent = document.createElement("span");
      parent.style.color = "rgb(255, 0, 0)";
      document.body.appendChild(parent);

      const child = document.createElement("span");
      // applyParentSpanStyles is private — only observable through reflection.
      (collector as any).applyParentSpanStyles(parent, child);

      expect(child.style.color).toBe("rgb(255, 0, 0)");
    });

    it("does NOT copy styles when the parent element is not a <span>", () => {
      const collector = makeCollector(IndentationMode.Spaces, 4);
      const parent = document.createElement("div");
      parent.style.fontWeight = "bold";
      document.body.appendChild(parent);

      const child = document.createElement("span");
      (collector as any).applyParentSpanStyles(parent, child);

      expect(child.style.fontWeight).not.toBe("bold");
    });

    it("propagates italic font-style from an inner <span> to both output paragraphs", () => {
      const collector = makeCollector(IndentationMode.Spaces);
      const outerSpan = document.createElement("span");
      const innerSpan = document.createElement("span");
      innerSpan.style.fontStyle = "italic";
      innerSpan.appendChild(createTextNode("  Hello\nWorld"));
      outerSpan.appendChild(innerSpan);

      attachToDom(original, cloned, outerSpan);

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.querySelectorAll("p"));

      expect(paragraphs).toHaveLength(2);

      const hasItalic = (p: HTMLElement) => Array.from(p.querySelectorAll("span")).some((s) => s.style.fontStyle === "italic");

      expect(hasItalic(paragraphs[0])).toBe(true);
      expect(hasItalic(paragraphs[1])).toBe(true);
    });
  });
});
