import { afterEach, describe, expect, it, vi } from "vitest";
import { IndentationFormatter } from "@utils/indentation-formatter";
import { SpecialCharacters } from "@constants";

const TAB_SIZE = 2;

describe("IndentationFormatter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("maskIndentation", () => {
    const cases: { desc: string; input: string; expected: string; tabSize?: number }[] = [
      {
        desc: "leading spaces",
        input: "  const x = 1;",
        expected: `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`,
      },
      {
        desc: "a leading tab",
        input: "\tconst x = 1;",
        expected: `${SpecialCharacters.MARKER.repeat(TAB_SIZE)}const x = 1;`,
      },
      {
        desc: "mixed tabs and spaces",
        input: "\t  const x = 1;",
        expected: `${SpecialCharacters.MARKER.repeat(TAB_SIZE)}` + `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`,
      },
      {
        desc: "no leading whitespace",
        input: "noindent",
        expected: "noindent",
      },
      {
        desc: "multi-line input with mixed whitespace per line",
        input: "\n  const x = 1;\n\tconst y = 2;",
        expected:
          `\n${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;` +
          `\n${SpecialCharacters.MARKER.repeat(TAB_SIZE)}const y = 2;`,
      },
    ];

    cases.forEach(({ desc, input, expected, tabSize }) => {
      it(`should mask ${desc}`, () => {
        expect(IndentationFormatter.maskIndentation(input, tabSize ?? TAB_SIZE)).toBe(expected);
      });
    });
  });

  describe("unmaskIndentationWithTabs", () => {
    const cases: { desc: string; input: string; expected: string; tabSize?: number }[] = [
      {
        desc: "one full tab group plus one extra marker (tabSize=2)",
        input: `${SpecialCharacters.MARKER.repeat(TAB_SIZE)}${SpecialCharacters.MARKER}const x = 1;`,
        expected: "\t const x = 1;",
      },
      {
        desc: "two complete tab groups (four markers, tabSize=2)",
        input: SpecialCharacters.MARKER.repeat(4) + "code();",
        expected: "\t\tcode();",
        tabSize: 2,
      },
      {
        desc: "one tab group plus one leftover marker (tabSize=2)",
        input: SpecialCharacters.MARKER.repeat(3) + "foo();",
        expected: "\t foo();",
        tabSize: 2,
      },
    ];

    cases.forEach(({ desc, input, expected, tabSize }) => {
      it(`should unmask with tabs for ${desc}`, () => {
        expect(IndentationFormatter.unmaskIndentationWithTabs(input, tabSize ?? TAB_SIZE)).toBe(expected);
      });
    });
  });

  describe("unmaskIndentationWithNbsp", () => {
    it("should convert every marker character to a non-breaking space (\\u00A0)", () => {
      const input = `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`;
      const expected = `${SpecialCharacters.NON_BREAKING_SPACE}` + `${SpecialCharacters.NON_BREAKING_SPACE}const x = 1;`;
      expect(IndentationFormatter.unmaskIndentationWithNbsp(input)).toBe(expected);
    });

    it("should leave strings that contain no marker characters unchanged", () => {
      const input = "function test() {\nreturn true;\n}";
      expect(IndentationFormatter.unmaskIndentationWithNbsp(input)).toBe(input);
    });

    it("should handle an empty string without throwing", () => {
      expect(IndentationFormatter.unmaskIndentationWithNbsp("")).toBe("");
    });
  });
});
