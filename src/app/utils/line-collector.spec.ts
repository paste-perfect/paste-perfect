import { INDENTATION_MODE_MAP } from "@constants";
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
    cloned = document.createElement("div");
  });

  it("splits lines and handles indentation in spaces mode", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 2);

    const span = createStyledSpan("  indented line\nsecond line");
    original.appendChild(span);
    cloned.appendChild(span.cloneNode(true));

    collector.collectLinesFromNodes(original, cloned);
    const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

    expect(paragraphs.length).toBe(2);
    expect(paragraphs.every((p) => p.tagName === "P")).toBe(true);
    expect(paragraphs[0].textContent).toContain("indented line");
    expect(paragraphs[1].textContent).toContain("second line");

    // Check for NBSP or visible indentation span
    expect(paragraphs[0].innerHTML).toMatch(/&nbsp;|[\u00A0]/); // should have preserved indentation
  });

  it("handles tab mode and sets styles accordingly", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Tabs, 2);

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

  it("creates paragraphs for empty line", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 2);

    const span = createStyledSpan("\n");
    original.appendChild(span);
    cloned.appendChild(span.cloneNode(true));

    collector.collectLinesFromNodes(original, cloned);
    const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];

    expect(paragraphs.length).toBe(2);
    paragraphs.forEach((p) => {
      expect(p.tagName).toBe("P");
      expect(p.textContent).toBe("\u00A0"); // non-breaking space
    });
  });

  it("ignores unsupported nodes like comments", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 2);

    const comment = document.createComment("some comment");
    original.appendChild(comment);
    cloned.appendChild(comment.cloneNode());

    collector.collectLinesFromNodes(original, cloned);

    // Comments are ignored, but untouched in clone
    expect(cloned.childNodes.length).toBe(1);
    expect(cloned.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
  });

  it("applies parent span styles when parent is span", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 4);

    const parent = document.createElement("span");
    parent.style.color = "red";

    const childSpan = document.createElement("span");
    collector["applyParentSpanStyles"](parent, childSpan);

    expect(childSpan.style.color).toBe("red");
  });

  it("does not apply styles if parent is not a span", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 4);

    const parent = document.createElement("div");
    parent.style.fontWeight = "bold";

    const childSpan = document.createElement("span");
    collector["applyParentSpanStyles"](parent, childSpan);

    expect(childSpan.style.fontWeight).not.toBe("bold");
  });

  it("handles mixed content with spans and text", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 2);

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

    // Confirm italics from original are retained
    const firstLineSpans = paragraphs[0].querySelectorAll("span");
    expect(Array.from(firstLineSpans).some((span) => span.style.fontStyle === "italic")).toBe(true);
  });

  it("preserves multiple indentation markers as spaces (spaces mode)", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Spaces, 2);

    const span = createStyledSpan("    Indented");
    original.appendChild(span);
    cloned.appendChild(span.cloneNode(true));

    collector.collectLinesFromNodes(original, cloned);
    const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];
    const markerSpan = paragraphs[0].querySelector("span");

    expect(markerSpan?.textContent).toMatch(/^\s+/); // starts with multiple spaces
    expect(markerSpan?.innerHTML).toMatch(/&nbsp;|[\u00A0]/); // should be preserved
  });

  it("applies tab spacing styles for tab mode", () => {
    const collector = new LinesCollector(INDENTATION_MODE_MAP.Tabs, 4);

    const span = createStyledSpan("\t\tTabbed");
    original.appendChild(span);
    cloned.appendChild(span.cloneNode(true));

    collector.collectLinesFromNodes(original, cloned);

    const paragraphs = Array.from(cloned.childNodes) as HTMLParagraphElement[];
    const markerSpan = paragraphs[0].querySelector("span");

    expect(markerSpan?.textContent).toMatch(/\t+/); // replaced with tab characters
    expect(markerSpan?.getAttribute("style") || "").toMatch(/mso-tab-count|tab-stops/); // MS Office tab spacing
  });
});
