import { IndentationMode } from "@constants";
import { LinesCollector } from "@utils/line-collector";

const createTextNode = (text: string): Text => document.createTextNode(text);

const createStyledSpan = (text: string, style: Partial<CSSStyleDeclaration> = {}): HTMLSpanElement => {
  const span = document.createElement("span");
  Object.assign(span.style, style);
  span.appendChild(createTextNode(text));
  return span;
};

describe("LinesCollector", () => {
  let original: HTMLElement;
  let cloned: HTMLElement;

  beforeEach(() => {
    original = document.createElement("div");
    cloned = original.cloneNode(true) as HTMLElement;
  });

  describe("when hasLineNumbers is false", () => {
    it("splits lines and handles indentation in spaces mode", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
      const span = createStyledSpan("  indented line\nsecond line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(2);
      expect(paragraphs.every((p) => p.tagName === "P")).toBe(true);
      expect(paragraphs[0].textContent).toContain("indented line");
      expect(paragraphs[1].textContent).toContain("second line");
      expect(paragraphs[0].innerHTML).toMatch(/&nbsp;|[\u00A0]/);
    });

    it("handles tab mode and sets styles accordingly", () => {
      const collector = new LinesCollector(IndentationMode.Tabs, 2, false);
      const span = createStyledSpan("    Tabbed text\nNext");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toContain("Tabbed text");
      expect(paragraphs[1].textContent).toContain("Next");
      paragraphs.forEach((p) => {
        const style = p.getAttribute("style") || "";
        expect(style).toMatch(/tab-stops:.*left/);
      });
    });

    it("creates paragraphs for empty lines", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
      const span = createStyledSpan("\n");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(2);
      paragraphs.forEach((p) => {
        expect(p.tagName).toBe("P");
        expect(p.textContent).toBe("\u00A0");
      });
    });

    it("ignores unsupported nodes like comments", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
      const comment = document.createComment("some comment");
      original.appendChild(comment);
      cloned.appendChild(comment.cloneNode());

      collector.collectLinesFromNodes(original, cloned);

      expect(cloned.childNodes.length).toBe(1);
      expect(cloned.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
    });
  });

  describe("when hasLineNumbers is true", () => {
    beforeEach(() => {
      // Mock getLiveLineNumberWidth to avoid dependency on a live DOM
      const mockElement = document.createElement("span");
      jest.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({ width: 50 } as DOMRect);
      jest.spyOn(document, "getElementsByClassName").mockReturnValue([mockElement] as unknown as HTMLCollectionOf<Element>);
    });

    it("should parse and separate line numbers from content", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("1. First line\n2. Second line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(2);
      // First line
      const firstLineSpans = Array.from(paragraphs[0].childNodes) as HTMLSpanElement[];
      expect(firstLineSpans[0].textContent).toBe("1. ");
      expect(firstLineSpans[1].textContent).toBe("First line");
      // Second line
      const secondLineSpans = Array.from(paragraphs[1].childNodes) as HTMLSpanElement[];
      expect(secondLineSpans[0].textContent).toBe("2. ");
      expect(secondLineSpans[1].textContent).toBe("Second line");
    });

    it("should handle indentation after a line number", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("1.   Indented line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const p = cloned.childNodes[0] as HTMLParagraphElement;
      const lineSpans = Array.from(p.childNodes) as HTMLSpanElement[];

      expect(lineSpans.length).toBe(3);
      expect(lineSpans[0].textContent).toBe("1. "); // Line number span
      expect(lineSpans[1].innerHTML).toMatch(/&nbsp;|[\u00A0]/); // Indentation span
      expect(lineSpans[2].textContent).toBe("Indented line"); // Text span
    });

    it("should not treat numbers mid-line as line numbers", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("Not a line number 1. but text");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const p = cloned.childNodes[0] as HTMLParagraphElement;

      expect(p.textContent).toBe("Not a line number 1. but text");
      expect(p.childNodes.length).toBe(1); // Should be a single text node/span
    });

    it("should handle lines without line numbers correctly", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, true);
      const span = createStyledSpan("1. First line\n   (indented continuation)\n2. Second line");
      original.appendChild(span);
      cloned.appendChild(span.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(3);
      // First line
      expect(paragraphs[0].textContent).toBe("1. First line");
      // Second line (no line number, just indentation)
      expect(paragraphs[1].textContent).toContain("(indented continuation)");
      expect(paragraphs[1].innerHTML).toMatch(/&nbsp;|[\u00A0]/);
      // Third line
      expect(paragraphs[2].textContent).toBe("2. Second line");
    });
  });

  describe("Style and Node Handling", () => {
    it("applies parent span styles when parent is span", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 4, false);
      const parent = document.createElement("span");
      parent.style.color = "rgb(255, 0, 0)";
      const childSpan = document.createElement("span");
      collector["applyParentSpanStyles"](parent, childSpan);
      expect(childSpan.style.color).toBe("rgb(255, 0, 0)");
    });

    it("does not apply styles if parent is not a span", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 4, false);
      const parent = document.createElement("div");
      parent.style.fontWeight = "bold";
      const childSpan = document.createElement("span");
      collector["applyParentSpanStyles"](parent, childSpan);
      expect(childSpan.style.fontWeight).not.toBe("bold");
    });

    it("handles mixed content with spans and text", () => {
      const collector = new LinesCollector(IndentationMode.Spaces, 2, false);
      const outerSpan = document.createElement("span");
      const innerSpan = document.createElement("span");
      innerSpan.style.fontStyle = "italic";
      innerSpan.appendChild(createTextNode("  Hello\nWorld"));
      outerSpan.appendChild(innerSpan);
      original.appendChild(outerSpan);
      cloned.appendChild(outerSpan.cloneNode(true));

      collector.collectLinesFromNodes(original, cloned);
      const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toContain("Hello");
      expect(paragraphs[1].textContent).toContain("World");
      const firstLineSpans = paragraphs[0].querySelectorAll("span");
      expect(Array.from(firstLineSpans).some((span) => span.style.fontStyle === "italic")).toBe(true);
    });
  });
});
