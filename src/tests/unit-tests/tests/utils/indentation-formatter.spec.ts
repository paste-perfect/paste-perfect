import { describe, expect, it } from "vitest";
import { IndentationFormatter } from "@utils/indentation-formatter";
import { SpecialCharacters } from "@constants/special-characters";
import { useStandardTeardown } from "../../test-utils/utils";

const TAB_SIZE = 2;
const M = SpecialCharacters.MARKER;

describe("IndentationFormatter", () => {
  useStandardTeardown();

  describe("maskIndentation", () => {
    it.each([
      ["leading spaces", "  const x = 1;", `${M}${M}const x = 1;`, undefined],
      ["a leading tab", "\tconst x = 1;", `${M.repeat(TAB_SIZE)}const x = 1;`, undefined],
      ["mixed tabs and spaces", "\t  const x = 1;", `${M.repeat(TAB_SIZE)}${M}${M}const x = 1;`, undefined],
      ["no leading whitespace", "noindent", "noindent", undefined],
      [
        "multi-line input with mixed whitespace per line",
        "\n  const x = 1;\n\tconst y = 2;",
        `\n${M}${M}const x = 1;\n${M.repeat(TAB_SIZE)}const y = 2;`,
        undefined,
      ],
    ] as const)("masks %s", (_desc, input, expected, tabSize) => {
      expect(IndentationFormatter.maskIndentation(input, tabSize ?? TAB_SIZE)).toBe(expected);
    });
  });

  describe("unmaskIndentationWithTabs", () => {
    it.each([
      ["one full tab group plus one extra marker", `${M.repeat(TAB_SIZE)}${M}const x = 1;`, "\t const x = 1;", undefined],
      ["two complete tab groups (four markers)", `${M.repeat(4)}code();`, "\t\tcode();", 2],
      ["one tab group plus one leftover marker", `${M.repeat(3)}foo();`, "\t foo();", 2],
    ] as const)("unmasks with tabs for %s", (_desc, input, expected, tabSize) => {
      expect(IndentationFormatter.unmaskIndentationWithTabs(input, tabSize ?? TAB_SIZE)).toBe(expected);
    });
  });

  describe("unmaskIndentationWithNbsp", () => {
    const NBSP = SpecialCharacters.NON_BREAKING_SPACE;

    it("converts every marker character to a non-breaking space (\\u00A0)", () => {
      expect(IndentationFormatter.unmaskIndentationWithNbsp(`${M}${M}const x = 1;`)).toBe(`${NBSP}${NBSP}const x = 1;`);
    });

    it("leaves strings that contain no marker characters unchanged", () => {
      const input = "function test() {\nreturn true;\n}";
      expect(IndentationFormatter.unmaskIndentationWithNbsp(input)).toBe(input);
    });

    it("handles an empty string without throwing", () => {
      expect(IndentationFormatter.unmaskIndentationWithNbsp("")).toBe("");
    });
  });
});
