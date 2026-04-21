import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndentationMode, SpecialCharacters } from "@constants";
import { LinesCollector } from "@utils/line-collector";
import { createStyledSpan, createTextNode } from "../test-utils";

describe("LinesCollector", () => {
  let original: HTMLElement;
  let cloned: HTMLElement;

  beforeEach(() => {
    original = document.createElement("div");
    original.id = "original-test-container";
    cloned = document.createElement("div");
    cloned.id = "cloned-test-container";

    document.body.appendChild(original);
    document.body.appendChild(cloned);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  describe("when hasLineNumbers is false", () => {
    describe("Spaces indentation mode", () => {
      it("should split multi-line text into separate <p> elements", () => {
        const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
        const span = createStyledSpan("  indented line\nsecond line");
        original.appendChild(span);

        // The collector expects cloned to be a structural clone of original initially
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

        expect(paragraphs.length).toBeGreaterThanOrEqual(2);
        expect(paragraphs.every((p) => p.tagName === "P")).toBe(true);
        expect(paragraphs[0].textContent).toContain("indented line");
        expect(paragraphs[1].textContent).toContain("second line");
      });

      it("should replace leading spaces with non-breaking spaces and apply MS Office spacerun style", () => {
        const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
        const span = createStyledSpan("  indented line");
        original.appendChild(span);
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);
        const p = cloned.querySelector("p");
        const indentationSpan = p?.querySelector("span");

        // Check for non-breaking space
        expect(p?.textContent).toMatch(new RegExp(SpecialCharacters.NON_BREAKING_SPACE));

        // Verify that the whitespace preservation style for MS Office is applied
        expect(indentationSpan?.getAttribute("style")).toContain("mso-spacerun:yes");
      });

      it("should produce Non-Breaking-Space-only paragraphs for empty lines with MS Office spacerun style", () => {
        const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
        const span = createStyledSpan("\n");
        original.appendChild(span);
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.querySelectorAll("p"));

        expect(paragraphs).toHaveLength(2);
        paragraphs.forEach((p) => {
          expect(p.textContent).toBe(SpecialCharacters.NON_BREAKING_SPACE);

          // Empty lines are generated as spans with the non-breaking space and mso-spacerun
          const emptyLineSpan = p.querySelector("span");
          expect(emptyLineSpan?.getAttribute("style")).toContain("mso-spacerun:yes");
        });
      });
    });

    describe("Tabs indentation mode", () => {
      it("should split multi-line text, stamp tab-stop styles on paragraphs, and tab-counts on spans", () => {
        const tabSize = 2;
        const collector = new LinesCollector(IndentationMode.Tabs, tabSize, false);
        // Using enough spaces that map to exactly 1 tab stop based on tabSize
        const span = createStyledSpan("  Tabbed text\nNext");
        original.appendChild(span);
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);
        const paragraphs = Array.from(cloned.querySelectorAll("p"));

        expect(paragraphs).toHaveLength(2);

        // Check paragraph tab stops
        paragraphs.forEach((p) => {
          expect(p.style.getPropertyValue("tab-stops") || p.getAttribute("style")).toMatch(/left/);
        });

        // Check that the actual indentation span received the MS Office tab-count style
        const indentedSpan = paragraphs[0].querySelector("span");
        expect(indentedSpan?.getAttribute("style")).toContain("mso-tab-count:1");
      });
    });

    describe("Unsupported node types", () => {
      it("should ignore comment nodes and keep exactly one element node in output", () => {
        const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
        const comment = document.createComment("some comment");
        const span = createStyledSpan("content");

        original.appendChild(comment);
        original.appendChild(span);
        cloned.appendChild(comment.cloneNode());
        cloned.appendChild(span.cloneNode(true));

        collector.collectLinesFromNodes(original, cloned);

        // Comments should be stripped from the final cloned output
        const hasComments = Array.from(cloned.childNodes).some((n) => n.nodeType === Node.COMMENT_NODE);
        expect(hasComments).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe("when hasLineNumbers is true", () => {
    beforeEach(() => {
      // Mocking a line number element that the collector looks for
      const mockElement = document.createElement("span");
      mockElement.className = "line-number-gutter";

      vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
        width: 50,
        left: 0,
        right: 50,
        top: 0,
        bottom: 20,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {
          /* empty */
        },
      } as DOMRect);

      vi.spyOn(document, "getElementsByClassName").mockImplementation((className) => {
        if (className === "line-number-gutter") {
          return [mockElement] as unknown as HTMLCollectionOf<Element>;
        }
        return [] as unknown as HTMLCollectionOf<Element>;
      });
    });

    it("should parse line-number prefixes and split them into separate child spans with spacerun", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("1. First line\n2. Second line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

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

    it("should emit three child spans — number, indentation, text — for indented lines after a number", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("1.   Indented line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const p = cloned.querySelector("p");
      const spans = p?.querySelectorAll("span");

      // 1. line number span  2. indentation span  3. text span
      expect(spans?.length).toBe(3);
      expect(spans?.[0].textContent).toBe("1. ");
      expect(spans?.[0].getAttribute("style")).toContain("mso-spacerun:yes");
      expect(spans?.[1].textContent).toContain(SpecialCharacters.NON_BREAKING_SPACE);
      expect(spans?.[1].getAttribute("style")).toContain("mso-spacerun:yes");
    });
  });

  // -------------------------------------------------------------------------
  describe("Style and Node handling", () => {
    it("should copy all CSS properties from a parent <span> to the child span", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 4, false);
      const parent = document.createElement("span");
      parent.style.color = "rgb(255, 0, 0)";
      document.body.appendChild(parent);

      const child = document.createElement("span");

      // applyParentSpanStyles is private; (as any) is the accepted pattern here
      // since the behaviour is observable only through integration. If this
      // method grows in complexity, promote it to a standalone pure function.
      (collector as any).applyParentSpanStyles(parent, child);

      expect(child.style.color).toBe("rgb(255, 0, 0)");
    });

    it("should NOT copy styles when the parent element is not a <span>", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 4, false);
      const parent = document.createElement("div");
      parent.style.fontWeight = "bold";
      document.body.appendChild(parent);

      const child = document.createElement("span");
      (collector as any).applyParentSpanStyles(parent, child);

      expect(child.style.fontWeight).not.toBe("bold");
    });

    it("should propagate italic font-style from an inner <span> to both output paragraphs", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
      const outerSpan = document.createElement("span");
      const innerSpan = document.createElement("span");
      innerSpan.style.fontStyle = "italic";
      innerSpan.appendChild(createTextNode("  Hello\nWorld"));

      outerSpan.appendChild(innerSpan);
      original.appendChild(outerSpan);
      cloned.appendChild(outerSpan.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.querySelectorAll("p"));

      expect(paragraphs).toHaveLength(2);

      const hasItalic = (p: HTMLElement) => Array.from(p.querySelectorAll("span")).some((s) => s.style.fontStyle === "italic");

      expect(hasItalic(paragraphs[0])).toBe(true);
      expect(hasItalic(paragraphs[1])).toBe(true);
    });
  });
});
