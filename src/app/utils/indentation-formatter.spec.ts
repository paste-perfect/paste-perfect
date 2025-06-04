import { IndentationFormatter } from "@utils/indentation-formatter";
import { SpecialCharacters } from "@constants";

describe("IndentationFormatter", () => {
  const tabSize = 2;

  describe("maskIndentation", () => {
    const cases = [
      {
        input: "  const x = 1;",
        expected: `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`,
        desc: "leading spaces",
      },
      {
        input: "\tconst x = 1;",
        expected: `${SpecialCharacters.MARKER.repeat(tabSize)}const x = 1;`,
        desc: "leading tab",
      },
      {
        input: "\t  const x = 1;",
        expected: `${SpecialCharacters.MARKER.repeat(tabSize)}${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`,
        desc: "mixed tabs and spaces",
      },
      { input: "noindent", expected: "noindent", desc: "no leading whitespace" },
      {
        input: "\n  const x = 1;\n\tconst y = 2;",
        expected: `\n${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;\n${SpecialCharacters.MARKER.repeat(tabSize)}const y = 2;`,
        desc: "multi-line input",
      },
    ];

    cases.forEach(({ input, expected, desc }) => {
      it(`should mask ${desc}`, () => {
        const result = IndentationFormatter.maskIndentation(input, tabSize);
        expect(result).toBe(expected);
      });
    });
  });

  describe("unmaskIndentationWithTabs", () => {
    const cases = [
      {
        input: `${SpecialCharacters.MARKER.repeat(tabSize)}${SpecialCharacters.MARKER}const x = 1;`,
        expected: `\t const x = 1;`,
        desc: "tabSize marker group + one extra marker",
      },
      {
        input: `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}code();`,
        expected: `\t\tcode();`,
        tabSize: 2,
        desc: "two tab groups",
      },
      {
        input: `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}foo();`,
        expected: `\t foo();`,
        tabSize: 2,
        desc: "tab group + one leftover",
      },
    ];

    cases.forEach(({ input, expected, desc, tabSize: customTabSize }) => {
      it(`should unmask with tabs for ${desc}`, () => {
        const result = IndentationFormatter.unmaskIndentationWithTabs(input, customTabSize ?? tabSize);
        expect(result).toBe(expected);
      });
    });
  });

  describe("unmaskIndentationWithNbsp", () => {
    it("should convert all markers to non-breaking spaces", () => {
      const input = `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`;
      const result = IndentationFormatter.unmaskIndentationWithNbsp(input);
      expect(result).toBe(`${SpecialCharacters.NON_BREAKING_SPACE}${SpecialCharacters.NON_BREAKING_SPACE}const x = 1;`);
    });

    it("should leave non-marker text unchanged", () => {
      const input = `function test() {\nreturn true;\n}`;
      const result = IndentationFormatter.unmaskIndentationWithNbsp(input);
      expect(result).toBe(input);
    });
  });
});
